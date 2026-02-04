import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    // 📌 A quién va dirigida
    scope: {
      type: String,
      enum: ["user", "admin", "global"], 
      required: true,
      default: "user", // por defecto es para un usuario específico
    },

    // 📌 Solo aplica si la notificación es para un usuario en particular
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // 📌 Tipo de notificación (clasificación funcional)
    type: {
      type: String,
      enum: ["order", "system", "promo", "admin", "stock"],
      required: true,
    },

    // 📌 Contenido de la notificación
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },

    // 📌 Metadata adicional (ej: orderId, productId, link a la acción, etc.)
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // 📌 Estado de lectura
    read: {
      type: Boolean,
      default: false, // solo para notificaciones personales
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // útil en global/admin
      },
    ],

    // 📌 Prioridad
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);