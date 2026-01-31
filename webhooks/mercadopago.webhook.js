import Order from "../models/orders.model.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { updateStockAndStatus } from "../Payments/utils/updateStockAfterPayment.js";
import { paymentClient } from "../Payments/utils/mercadopago.js";

export const mercadopagoWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type !== "payment") return res.sendStatus(200);

    const paymentId = data?.id;
    if (!paymentId) return res.sendStatus(200);

    const payment = await paymentClient.get({ id: paymentId });
    if (payment.status !== "approved") return res.sendStatus(200);

    const metadata = payment.metadata || {};
    const userId = metadata.userId;
    const cart = JSON.parse(metadata.cart || "[]");
    const shippingAddress = JSON.parse(metadata.shippingAddress || "{}");
    const total = metadata.total || payment.transaction_amount;

    if (!userId || !cart.length) return res.sendStatus(200);

    // Evitar pagos duplicados
    const alreadyPaid = await Payment.findOne({ transactionId: paymentId });
    if (alreadyPaid) return res.sendStatus(200);

    // Crear la orden **solo ahora**
    const order = await Order.create({
      userId,
      items: cart,
      total,
      status: "paid",
      paymentInfo: {
        method: "mercadopago",
        transactionId: paymentId,
        paidAt: payment.date_approved ? new Date(payment.date_approved) : new Date(),
      },
      shippingAddress,
    });

    // Guardar Payment
    await Payment.create({
      orderId: order._id,
      userId,
      method: "mercadopago",
      transactionId: paymentId,
      amount: payment.transaction_amount,
      currency: payment.currency_id || "CLP",
      status: payment.status,
      paidAt: payment.date_approved ? new Date(payment.date_approved) : new Date(),
    });

    // Actualizar stock
    await updateStockAndStatus(order);

    // Actualizar fidelización
    const stamps = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const user = await User.findById(userId);
    if (user) {
      user.stamps = Math.min(10, (user.stamps || 0) + stamps);
      if (!user.card) user.card = true;
      await user.save();
    }

    // Crear notificación
    await Notification.create({
      userId,
      type: "order",
      title: "🎉 Pago confirmado",
      message: `Tu pedido #${order._id} fue pagado correctamente`,
    });

    return res.sendStatus(200);
  } catch (error) {
    console.error("MercadoPago webhook error:", error);
    return res.sendStatus(500);
  }
};
