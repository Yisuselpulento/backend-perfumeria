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

    // Debug: mostrar tipo y data
    console.log("Tipo de evento:", type);
    console.log("Data recibida:", data);

    // Solo procesar pagos
    if (type !== "payment") {
      console.log("No es un pago. Ignorando webhook.");
      return res.sendStatus(200);
    }

    const paymentId = data?.id;
    if (!paymentId) {
      console.log("No se encontró paymentId. Ignorando webhook.");
      return res.sendStatus(200);
    }
    console.log("Payment ID recibido:", paymentId);

    // Obtener pago desde MercadoPago
    const payment = await paymentClient.get({ id: paymentId });
    console.log("Pago obtenido desde MercadoPago:", payment);

    if (payment.status !== "approved") {
      console.log("Pago no aprobado:", payment.status);
      return res.sendStatus(200);
    }

    // 🔹 Tomar metadata enviada desde checkout
    const metadata = payment.metadata || {};
    const orderId = metadata.order_id || metadata.orderId;
    const userId = metadata.user_id || metadata.userId;

    console.log("Metadata del pago:", metadata);

    if (!orderId || !userId) {
      console.log("No se encontró orderId o userId en metadata. Ignorando webhook.");
      return res.sendStatus(200);
    }
    console.log("Procesando Order ID:", orderId, "User ID:", userId);

    // Evitar pagos duplicados
    const alreadyPaid = await Payment.findOne({ transactionId: paymentId });
    if (alreadyPaid) {
      console.log("Pago ya registrado. Ignorando webhook.");
      return res.sendStatus(200);
    }

    // Buscar orden
    const order = await Order.findById(orderId);
    if (!order) {
      console.log("Orden no encontrada:", orderId);
      return res.sendStatus(200);
    }
    console.log("Orden encontrada:", order._id);

    // 🔹 Guardar Payment
    const paymentDoc = await Payment.create({
      orderId,
      userId,
      method: "mercadopago",
      transactionId: paymentId,
      amount: payment.transaction_amount,
      currency: payment.currency_id || "CLP",
      status: payment.status,
      paidAt: payment.date_approved ? new Date(payment.date_approved) : new Date(),
    });
    console.log("Payment creado:", paymentDoc._id);

    // 🔹 Actualizar orden
    order.status = "paid";
    order.paymentInfo = {
      method: "mercadopago",
      transactionId: paymentId,
      paidAt: payment.date_approved ? new Date(payment.date_approved) : new Date(),
    };
    await order.save();
    console.log("Orden actualizada a 'paid'");

    // 🔹 Actualizar stock
    await updateStockAndStatus(order);
    console.log("Stock actualizado");

    // 🔹 Actualizar fidelización
    const stamps = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const user = await User.findById(userId);
    if (user) {
      user.stamps = Math.min(10, (user.stamps || 0) + stamps);
      if (!user.card) user.card = true;
      await user.save();
      console.log("Fidelización del usuario actualizada");
    }

    // 🔹 Crear notificación
    const notification = await Notification.create({
      userId,
      type: "order",
      title: "🎉 Pago confirmado",
      message: `Tu pedido #${order._id} fue pagado correctamente`,
    });
    console.log("Notificación creada:", notification._id);

    return res.sendStatus(200);
  } catch (error) {
    console.error("MercadoPago webhook error:", error);
    return res.sendStatus(500);
  }
};
