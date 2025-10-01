import { Notification } from "../../models/notification.model.js";

// ----------------- Usuario -----------------
export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { scope: "user", userId: req.userId },
        { scope: "global" }
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
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notificación no encontrada" });
    }

    if (notification.scope === "user") {
      // Solo dueño puede marcarla
      if (notification.userId?.toString() !== req.userId) {
        return res.status(403).json({ success: false, message: "No autorizado" });
      }
      notification.read = true;
    } else {
      // Global o admin -> usar readBy
      if (!notification.readBy.includes(req.userId)) {
        notification.readBy.push(req.userId);
      }
    }

    await notification.save();
    res.json({ success: true, message: "Notificación marcada como leída", data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al actualizar notificación" });
  }
};
// ----------------- Admin -----------------
export const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { type: "admin" },
        { scope: "global" }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener notificaciones admin" });
  }
};

export const createNotification = async (req, res) => {
  const { scope, userId, type, title, message, meta, priority } = req.body;

  try {
    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Título y mensaje son obligatorios" });
    }

    if (!["user", "admin", "global"].includes(scope)) {
      return res.status(400).json({ success: false, message: "Scope inválido" });
    }

    let normalizedMeta = { ...meta };
    if (normalizedMeta.expiresAt) {
      const date = new Date(normalizedMeta.expiresAt);
      normalizedMeta.expiresAt = isNaN(date) ? null : date;
    }
    Object.keys(normalizedMeta).forEach((key) => {
      if (normalizedMeta[key] === "") delete normalizedMeta[key];
    });

    const notification = new Notification({
      scope,
      userId: scope === "user" ? userId : null,
      type: type || "system",
      title,
      message,
      meta: normalizedMeta,
      priority: priority || "low",
      readBy: []
    });

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
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notificación no encontrada" });
    }

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
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notificación no encontrada" });
    }

    res.json({ success: true, message: "Notificación eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al eliminar notificación" });
  }
};