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

// CORRECCIÓN: usar snake_case
const { order_id, user_id } = payment.metadata || {};
if (!order_id || !user_id) return res.sendStatus(200);

const alreadyPaid = await Payment.findOne({ transactionId: paymentId });
if (alreadyPaid) return res.sendStatus(200);

const order = await Order.findById(order_id);
if (!order) return res.sendStatus(200);

// Guardar Payment
await Payment.create({
  orderId: order_id,
  userId: user_id,
  method: "mercadopago",
  transactionId: paymentId,
  amount: payment.transaction_amount,
  currency: payment.currency_id || "CLP",
  status: payment.status,
  paidAt: payment.date_approved ? new Date(payment.date_approved) : new Date(),
});

// Actualizar Order
order.status = "paid";
order.paymentInfo = {
  method: "mercadopago",
  transactionId: paymentId,
  paidAt: payment.date_approved ? new Date(payment.date_approved) : new Date(),
};
await order.save();

// Actualizar stock
await updateStockAndStatus(order);

// Actualizar fidelización
const stamps = order.items.reduce((sum, i) => sum + i.quantity, 0);
const user = await User.findById(user_id);
if (user) {
  user.stamps = Math.min(10, (user.stamps || 0) + stamps);
  if (!user.card) user.card = true;
  await user.save();
}

// Crear notificación
await Notification.create({
  userId: user_id,
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
