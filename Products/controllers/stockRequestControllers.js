// controllers/stockRequest.controller.js
import { StockRequest } from "../../models/stockRequest.model.js";
import { Notification } from "../../models/notification.model.js";
import { sendProductBackInStockEmail } from "../../resend/emails.js";

/**
 * USER
 */
export const requestOutOfStockProduct = async (req, res) => {
  const { productId } = req.body;
  const userId = req.userId;

  try {
    const exists = await StockRequest.findOne({
      userId,
      productId,
      status: "pending",
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Ya solicitaste este producto",
      });
    }

    const request = await StockRequest.create({
      userId,
      productId,
    });

    await Notification.create({
      scope: "admin",
      type: "stock",
      title: "Producto solicitado sin stock",
      message: "Un usuario solicitó un producto actualmente sin stock",
      meta: {
        productId,
        userId,
        requestId: request._id,
      },
      priority: "high",
    });

    res.json({
      success: true,
      message: "Solicitud enviada correctamente",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error al solicitar producto",
    });
  }
};

/**
 * ADMIN
 * Obtener todas las solicitudes
 */
export const getAllStockRequests = async (req, res) => {
  try {
    const requests = await StockRequest.find()
      .sort({ createdAt: -1 })
      .populate("userId", "email fullName")
      .populate("productId", "name image status");

    res.json({
      success: true,
      data: requests,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error al obtener solicitudes",
    });
  }
};

/**
 * ADMIN
 * Cambiar estado de la solicitud
 */
export const updateStockRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["pending", "notified", "resolved"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Estado inválido",
    });
  }

  try {
    // 🔎 Traemos la solicitud con user y product
    const request = await StockRequest.findById(id)
      .populate("userId")
      .populate("productId");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Solicitud no encontrada",
      });
    }

    // 🛑 Evitar re-notificar
    const wasAlreadyNotified = request.status === "notified";

    // ✏️ Actualizamos estado
    request.status = status;
    await request.save();

    // 🔔 Si se marca como NOTIFIED, avisamos al usuario
    if (status === "notified" && !wasAlreadyNotified) {
      const user = request.userId;
      const product = request.productId;

      // 📧 Email
      await sendProductBackInStockEmail(
        user.email,
        user.fullName,
        product.name,
        product._id
      );

      // 🔔 Notificación in-app
      await Notification.create({
        scope: "user",
        userId: user._id,
        type: "system",
        title: "Producto disponible 🖤",
        message: `El producto "${product.name}" ya volvió a estar disponible.`,
        meta: {
          productId: product._id,
          stockRequestId: request._id,
        },
        priority: "medium",
      });
    }

    res.json({
      success: true,
      message: "Estado actualizado",
      data: request,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error al actualizar estado",
    });
  }
};
