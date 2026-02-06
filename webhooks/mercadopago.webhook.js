import Order from "../models/orders.model.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { updateStockAndStatus } from "../Payments/utils/updateStockAfterPayment.js";
import { paymentClient } from "../Payments/utils/mercadopago.js";

export const mercadopagoWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    // Solo procesamos pagos
    if (type !== "payment") {
      return res.sendStatus(200);
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return res.sendStatus(200);
    }

    // Obtener pago desde MercadoPago
    const payment = await paymentClient.get({ id: paymentId });

    if (payment.status !== "approved") {
      return res.sendStatus(200);
    }

    // Metadata
    const metadata = payment.metadata || {};
    const orderId = metadata.order_id || metadata.orderId;

    if (!orderId) {
      return res.sendStatus(200);
    }

    // Evitar pagos duplicados
    const alreadyPaid = await Payment.findOne({ transactionId: paymentId });
    if (alreadyPaid) {
      return res.sendStatus(200);
    }

    // Buscar orden
    const order = await Order.findById(orderId);
    if (!order) {
      return res.sendStatus(200);
    }

    // Guardar pago
    await Payment.create({
      orderId: order._id,
      userId: order.userId || null,
      guestEmail: order.userId ? null : order.guestEmail,
      method: "mercadopago",
      transactionId: paymentId,
      amount: payment.transaction_amount,
      currency: payment.currency_id || "CLP",
      status: payment.status,
      paidAt: payment.date_approved
        ? new Date(payment.date_approved)
        : new Date(),
    });

    // Actualizar orden
    order.status = "paid";
    order.paymentInfo = {
      method: "mercadopago",
      transactionId: paymentId,
      paidAt: payment.date_approved
        ? new Date(payment.date_approved)
        : new Date(),
    };
    await order.save();

    // Actualizar stock
    await updateStockAndStatus(order);

    // Fidelización y notificación SOLO si hay usuario
    if (order.userId) {
      const stamps = order.items.reduce((sum, i) => sum + i.quantity, 0);
      const user = await User.findById(order.userId);

      if (user) {
        user.stamps = Math.min(10, (user.stamps || 0) + stamps);
        if (!user.card) user.card = true;
        await user.save();
      }

      await Notification.create({
        userId: order.userId,
        type: "order",
        title: "🎉 Pago confirmado",
        message: `Tu pedido #${order._id} fue pagado correctamente`,
      });
    }

    // Guests: solo flujo transaccional (email después)
    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(500);
  }
};