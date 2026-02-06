import mongoose from "mongoose";

const { Schema } = mongoose;

const orderItemSchema = new Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products",
    required: true,
  },
  variantId: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  image: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  volume: { type: Number, required: true },
});

const orderSchema = new Schema(
  {
    // 👇 AHORA OPCIONAL
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // 👇 NUEVO: email para guest checkout
    guestEmail: {
      type: String,
      lowercase: true,
      trim: true,
      required: function () {
        return !this.userId;
      },
    },

    items: [orderItemSchema],

    total: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "cancelled", "shipped", "delivered"],
      default: "pending",
    },

    paymentInfo: {
      method: { type: String },
      transactionId: { type: String },
      paidAt: { type: Date },
    },

    shippingAddress: {
      street: String,
      city: String,
      state: String,
      phone: String,
    },

    shippingProvider: {
      provider: String,
      trackingNumber: String,
      shippedAt: Date,
      deliveredAt: Date,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;