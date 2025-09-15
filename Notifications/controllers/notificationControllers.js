import { Notification } from "../../models/notification.model.js";

// ----------------- Usuario -----------------
export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { userId: req.userId }, // notificaciones individuales del usuario
        { userId: null }         // notificaciones globales
      ],
       type: { $ne: "admin" }
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener notificaciones" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findById(id);
    if (!notification) return res.status(404).json({ success: false, message: "Notificación no encontrada" });

    if (notification.userId?.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "No autorizado" });
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true, message: "Notificación marcada como leída", data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al actualizar notificación" });
  }
};

// ----------------- Admin -----------------
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .populate("userId", "email fullName");
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener notificaciones" });
  }
};

export const createNotification = async (req, res) => {
  const { userId, type, title, message, meta, priority } = req.body;

  try {
    const notification = new Notification({ userId, type, title, message, meta, priority });
    await notification.save();

    res.status(201).json({ success: true, message: "Notificación creada", data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al crear notificación" });
  }
};

export const updateNotification = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const notification = await Notification.findByIdAndUpdate(id, updates, { new: true });
    if (!notification) return res.status(404).json({ success: false, message: "Notificación no encontrada" });

    res.json({ success: true, message: "Notificación actualizada", data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al actualizar notificación" });
  }
};

export const deleteNotification = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) return res.status(404).json({ success: false, message: "Notificación no encontrada" });

    res.json({ success: true, message: "Notificación eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al eliminar notificación" });
  }
};