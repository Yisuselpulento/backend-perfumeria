import Order from "../../models/orders.model.js";
import { Notification } from "../../models/notification.model.js";
import {User} from "../../models/user.model.js";
import { sendOrderDeliveredEmail } from "../../resend/emails.js";


export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate("items.productId", "name image"); 

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener órdenes del usuario" });
  }
};

export const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id).populate("items.productId", "name image");

    if (!order) return res.status(404).json({ success: false, message: "Orden no encontrada" });

    if (!req.isAdmin && order.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "No autorizado para ver esta orden" });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener la orden" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("userId", "email fullName")       
      .populate("items.productId", "name image"); 

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener todas las órdenes" });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    "pending",
    "paid",
    "cancelled",
    "shipped",
    "delivered",
  ];

  if (!allowedStatuses.includes(status)) {
    return res
      .status(400)
      .json({ success: false, message: "Estado inválido" });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Orden no encontrada" });
    }

    // Evitar notificación duplicada si el estado no cambió
    if (order.status === status) {
      return res.json({
        success: true,
        message: "La orden ya tenía este estado",
        data: order,
      });
    }

    order.status = status;
    await order.save();

    // ------------------ NOTIFICACIÓN ------------------
    let notificationData = null;

    if (status === "paid") {
      notificationData = {
        scope: "user",
        userId: order.userId,
        type: "order",
        title: "Pago confirmado",
        message: "Tu pago fue recibido correctamente. Estamos preparando tu pedido.",
        meta: {
          orderId: order._id,
        },
        priority: "medium",
      };
    }

    if (status === "shipped") {
      notificationData = {
        scope: "user",
        userId: order.userId,
        type: "order",
        title: "Pedido enviado",
        message: "Tu pedido ya fue despachado y va en camino 🚚",
        meta: {
          orderId: order._id,
        },
        priority: "medium",
      };
          }

          if (status === "delivered") {
        notificationData = {
          scope: "user",
          userId: order.userId,
          type: "order",
          title: "Pedido entregado 🎉",
          message: "Tu pedido fue entregado con éxito. ¡Gracias por tu compra!",
          meta: {
            orderId: order._id,
          },
          priority: "high",
        };

        const user = await User.findById(order.userId);

        if (user) {
          await sendOrderDeliveredEmail(
            user.email,
            user.fullName,
            order._id
          );
        }
      }

    

    if (status === "cancelled") {
      notificationData = {
        scope: "user",
        userId: order.userId,
        type: "order",
        title: "Pedido cancelado",
        message: "Tu pedido fue cancelado. Si tienes dudas, contáctanos.",
        meta: {
          orderId: order._id,
        },
        priority: "high",
      };
    }

    if (notificationData) {
      await Notification.create(notificationData);
    }
    // ---------------------------------------------------

    res.json({
      success: true,
      message: "Estado actualizado",
      data: order,
    });
  } catch (err) {
    console.error("❌ Error updateOrderStatus:", err);
    res
      .status(500)
      .json({ success: false, message: "Error al actualizar estado" });
  }
};



export const deleteOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findByIdAndDelete(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Orden no encontrada" });

    res.json({ success: true, message: "Orden eliminada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al eliminar orden" });
  }
};