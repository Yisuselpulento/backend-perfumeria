import Order from "../models/orders.model.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { updateStockAndStatus } from "../Payments/utils/updateStockAfterPayment.js";
import { paymentClient } from "../Payments/utils/mercadopago.js";

export const mercadopagoWebhook = async (req, res) => {
  console.log("🔔 Webhook recibido:", req.body);

  try {
    const { type, data } = req.body;

    if (type !== "payment") {
      console.log("No es un pago. Ignorando webhook.");
      return res.sendStatus(200);
    }

    const paymentId = data?.id;
    if (!paymentId) {
      console.log("No se encontró paymentId.");
      return res.sendStatus(200);
    }

    // 🔹 Obtener pago desde MercadoPago
    const payment = await paymentClient.get({ id: paymentId });

    if (payment.status !== "approved") {
      console.log("Pago no aprobado:", payment.status);
      return res.sendStatus(200);
    }

    // 🔹 Metadata
    const orderId = payment.metadata?.orderId;

    if (!orderId) {
      console.log("No se encontró orderId en metadata.");
      return res.sendStatus(200);
    }

    // 🔹 Evitar pagos duplicados
    const alreadyPaid = await Payment.findOne({ transactionId: paymentId });
    if (alreadyPaid) {
      console.log("Pago ya registrado.");
      return res.sendStatus(200);
    }

    // 🔹 Buscar orden
    const order = await Order.findById(orderId);
    if (!order) {
      console.log("Orden no encontrada:", orderId);
      return res.sendStatus(200);
    }

    // 🔹 Guardar Payment (userId puede ser null)
    const paymentDoc = await Payment.create({
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

    console.log("Payment creado:", paymentDoc._id);

    // 🔹 Actualizar orden
    order.status = "paid";
    order.paymentInfo = {
      method: "mercadopago",
      transactionId: paymentId,
      paidAt: payment.date_approved
        ? new Date(payment.date_approved)
        : new Date(),
    };
    await order.save();

    // 🔹 Actualizar stock
    await updateStockAndStatus(order);

    // 🔹 Fidelización SOLO si hay usuario
    if (order.userId) {
      const stamps = order.items.reduce((sum, i) => sum + i.quantity, 0);
      const user = await User.findById(order.userId);

      if (user) {
        user.stamps = Math.min(10, (user.stamps || 0) + stamps);
        if (!user.card) user.card = true;
        await user.save();
        console.log("Fidelización actualizada");
      }

      // 🔹 Notificación SOLO para usuarios
      await Notification.create({
        userId: order.userId,
        type: "order",
        title: "🎉 Pago confirmado",
        message: `Tu pedido #${order._id} fue pagado correctamente`,
      });
    }

    // 👉 invitados: email transaccional (no notificación interna)
    if (!order.userId) {
      console.log("Compra guest confirmada:", order.guestEmail);
      // acá después puedes mandar email
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("MercadoPago webhook error:", error);
    return res.sendStatus(500);
  }
};