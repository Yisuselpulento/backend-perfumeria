import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema({
userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, 
type: { type: String, enum: ['order', 'system', 'promo', 'admin'], required: true },
title: { type: String, required: true },
message: { type: String, required: true },
meta: { type: Schema.Types.Mixed }, // para guardar data adicional (orderId, productId, url, etc.)
read: { type: Boolean, default: false },
priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });


export const Notification = mongoose.model('Notification', notificationSchema);