import Order from "../../models/orders.model.js";

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
  const allowedStatuses = ["pending", "paid", "cancelled", "shipped", "delivered"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Estado inválido" });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Orden no encontrada" });

    order.status = status;
    await order.save();

    res.json({ success: true, message: "Estado actualizado", data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al actualizar estado" });
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