import mongoose from "mongoose";

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    // 🔥 YA NO ES OBLIGATORIO
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },

    // 🔥 NUEVO: para compras sin sesión
    guestEmail: {
      type: String,
      default: null,
    },

    method: {
      type: String,
      required: true,
    },

    transactionId: {
      type: String,
      required: true,
      unique: true, // evita duplicados
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "CLP",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      required: true,
    },

    paidAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);