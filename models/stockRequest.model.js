// models/stockRequest.model.js
import mongoose from "mongoose";

const stockRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "notified", "resolved"],
    default: "pending",
  },
}, { timestamps: true });

export const StockRequest = mongoose.model("StockRequest", stockRequestSchema);
