import mongoose from "mongoose";

const { Schema } = mongoose;

const orderItemSchema = new Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
  variantId: { type: Schema.Types.ObjectId, required: true },
  sku: { type: String },
  name: { type: String, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  volume: { type: Number, required: true } 
});

const orderSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled", "shipped"],
      default: "pending"
    },
    paymentInfo: {
      method: { type: String }, 
      transactionId: { type: String },
      paidAt: { type: Date }
    },
    shippingAddress: {
      street: String,
      city: String,
      zip: String,
      state: String,
      phone: String
      },
      shippingProvider: {
      provider: String,
      trackingNumber: String,
      shippedAt: Date,
      deliveredAt: Date
      },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;