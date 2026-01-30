import mongoose from 'mongoose';

const { Schema } = mongoose;

const paymentSchema = new Schema({
orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
method: { type: String, required: true }, 
transactionId: { type: String },
amount: { type: Number, required: true },
currency: { type: String, default: 'CLP' },
 status: {
    type: String,
    enum: ["pending", "approved", "rejected"]
  },
paidAt: { type: Date }
}, { timestamps: true });


export const Payment = mongoose.model('Payment', paymentSchema);