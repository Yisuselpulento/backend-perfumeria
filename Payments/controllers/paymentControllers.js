import Order from "../../models/orders.model.js";
import Product from "../../models/products.model.js";
import {User} from "../../models/user.model.js";
import {Notification} from "../../models/notification.model.js";
import { Payment } from "../../models/payment.model.js";
import Stripe from "stripe";
import { updateStockAndStatus } from "../utils/updateStockAfterPayment.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); 

export const checkout = async (req, res) => {
  try {
    const userId = req.userId;
    const { items, shippingAddress, paymentInfo } = req.body;

    // Validaciones básicas
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No se proporcionaron productos en la orden" });
    }

    if (
      !shippingAddress ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.zip ||
      !shippingAddress.state ||
      !shippingAddress.phone
    ) {
      return res.status(400).json({ success: false, message: "Debe proporcionar una dirección de envío válida" });
    }

    if (!paymentInfo || !paymentInfo.method) {
      return res.status(400).json({ success: false, message: "Debe seleccionar un método de pago" });
    }

    if (paymentInfo.method === "card" && !paymentInfo.transactionId) {
      return res.status(400).json({ success: false, message: "Falta transactionId en el pago con tarjeta" });
    }

    // Validar que cada producto exista, variante válida y stock suficiente
    const validatedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.id);
        if (!product) throw new Error(`Producto con ID ${item.id} no encontrado`);

        const variant = product.variants.id(item.variant._id);
        if (!variant) throw new Error(`Variante con ID ${item.variant._id} no encontrada para ${product.name}`);

        if (item.quantity > variant.stock) {
          throw new Error(`Stock insuficiente para ${product.name} (${variant.volume}ml)`);
        }

        return {
          productId: product._id,
          variantId: variant._id,
          name: product.name,
          image: product.image,
          quantity: item.quantity,
          price: variant.price,
          volume: variant.volume
        };
      })
    );

    const total = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const newOrder = new Order({
      userId,
      items: validatedItems,
      total,
      status: paymentInfo.paidAt ? "paid" : "pending",
      paymentInfo: {
        method: paymentInfo.method,
        transactionId: paymentInfo.transactionId || null,
        paidAt: paymentInfo.paidAt || null,
      },
      shippingAddress,
    });

    await newOrder.save();

        // 🔹 Crear el pago vinculado
     const newPayment = new Payment({
      orderId: newOrder._id,
      userId,
      method: paymentInfo.method,
      transactionId: paymentInfo.transactionId || null,
      amount: total,
      status: paymentInfo.paidAt ? "completed" : "pending",
      paidAt: paymentInfo.paidAt || null,
    });

    await newPayment.save();

    await updateStockAndStatus(newOrder);

      // 🔹 Actualizar stamps del usuario
    const stampsToAdd = validatedItems.reduce((sum, item) => sum + item.quantity, 0);
    const user = await User.findById(userId);
    if (user) {
      let newStamps = Math.min(10, user.stamps + stampsToAdd);
      if (!user.card) user.card = true;
      user.stamps = newStamps;
      await user.save();
    }

       // 🔹 Notificación para el usuario
    await Notification.create({
      userId,
      type: "order",
      title: "Pedido recibido",
      message: `Tu pedido #${newOrder._id} fue recibido correctamente por un total de $${total}.`,
      meta: { orderId: newOrder._id, paymentId: newPayment._id },
    });

    // 🔹 Notificación para admin (opcional)
    await Notification.create({
      userId: null, // notificación general/admin
      type: "admin",
      title: "Nuevo pedido",
      message: `El usuario ${user?.name || "ID:" + userId} realizó un pedido #${newOrder._id} por $${total}.`,
      meta: { orderId: newOrder._id, userId },
    });

    return res.status(201).json({
      success: true,
      message: "Pago realizado correctamente.",
      data: newOrder,
    });
  } catch (error) {
    console.error("Error creando la orden:", error);
    return res.status(500).json({ success: false, message: error.message || "Error al crear la orden" });
  }
};

export const createPaymentIntent = async (req, res) => {
  const { total } = req.body;

  if (!total || total <= 0) {
    return res.status(400).json({ success: false, message: "Monto inválido" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "clp",
    });

    res.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creando PaymentIntent:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Marcar pago como fallido
export const failPayment = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ success: false, message: "orderId requerido" });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Orden no encontrada" });
    }

    // Actualizar estado del pago en BD
    await Payment.findOneAndUpdate(
      { orderId },
      { status: "failed" },
      { new: true }
    );

    // También puedes actualizar la orden
    order.status = "cancelled";
    await order.save();

    res.json({ success: true, message: "Pago marcado como fallido" });
  } catch (error) {
    console.error("Error marcando pago fallido:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const refundPayment = async (req, res) => {
  const { paymentId } = req.body;

  if (!paymentId) {
    return res.status(400).json({ success: false, message: "paymentId requerido" });
  }

  try {
    const payment = await Payment.findById(paymentId);
    if (!payment || !payment.transactionId) {
      return res.status(404).json({ success: false, message: "Pago no encontrado o sin transacción válida" });
    }

    // Crear refund en Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.transactionId,
    });

    // Actualizar estado del pago en BD
    payment.status = "refunded";
    await payment.save();

    res.json({ success: true, message: "Pago reembolsado", refund });
  } catch (error) {
    console.error("Error procesando reembolso:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

