import mongoose from "mongoose";

const { Schema } = mongoose;

/* =========================
   ITEMS DE LA ORDEN
========================= */
const orderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Products",
    required: true,
  },
  variantId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  volume: {
    type: Number,
    required: true,
  },
});

/* =========================
   ORDEN
========================= */
const orderSchema = new Schema(
  {
    /* 👤 Usuario (opcional) */
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* 📧 Guest checkout */
    guestEmail: {
      type: String,
      lowercase: true,
      trim: true,
      required: function () {
        return !this.userId;
      },
    },

    /* 🛒 Productos */
    items: {
      type: [orderItemSchema],
      required: true,
    },

    /* 💰 Totales */
    subtotal: {
      type: Number,
      required: true,
    },

    shippingCost: {
      type: Number,
      required: true,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
    },

    /* 🚚 Entrega */
    delivery: {
      method: {
        type: String,
        enum: ["shipping", "pickup"],
        required: true,
      },

      pickupLocation: {
        type: String,
        default: null, // "Los Andes"
      },
    },

    /* 🏠 Dirección (solo si shipping) */
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      phone: String,
    },

    /* 📦 Proveedor de envío */
    shippingProvider: {
      provider: String,
      trackingNumber: String,
      shippedAt: Date,
      deliveredAt: Date,
    },

    /* 💳 Pago */
    paymentInfo: {
      method: {
        type: String,
      },
      transactionId: {
        type: String,
      },
      paidAt: {
        type: Date,
      },
    },

    /* 📌 Estado */
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled", "shipped", "delivered"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;