import mongoose from 'mongoose';

const { Schema } = mongoose;

const ingredientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true }
  });

const variantSchema = new mongoose.Schema({
    volume: {
      type: Number,
      enum: [3, 5, 10],
      required: true
    },
    price: { type: Number, required: true },
    stock: { type: Number, required: true }
  });
  
  const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String }
  });

  const tagSchema = new Schema({
  name: { type: String, required: true },
  intensity: { type: Number, required: true, min: 1, max: 10 }
});

const productSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },  
  brand: { 
    type: String, 
    required: true
 },
 variants: [variantSchema],
  category: { 
    type: String, 
    enum: ['men', 'women', 'unisex'], 
    required: true 
  },
  image: {
    type: String,
    required: true
  },
 onSale: { 
    type: Boolean, 
    default: false 
  },  
  status: { 
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    required: true
  },
  ingredients: [ingredientSchema],
   tags: [tagSchema],
  reviews: [reviewSchema],
  sold: { 
    type: Number,
     default: 0 
    }

}, { timestamps: true }); 

const Product = mongoose.model('Products', productSchema);

export default Product;