import mongoose from 'mongoose';

const { Schema } = mongoose;

const addressSchema = new Schema({
userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
street: { type: String, required: true },
city: { type: String, required: true },
label: { type: String, default: 'Casa' },
state: { type: String },
phone: { type: String }, 
isDefault: { type: Boolean, default: false }
}, { timestamps: true });


export const Address = mongoose.model('Address', addressSchema);