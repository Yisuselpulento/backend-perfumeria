import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const { Schema } = mongoose;

const ingredientSchema = new Schema({
    name: { type: String, required: true },
    image: { type: String, required: true }
  });

const variantSchema = new mongoose.Schema({
volume: { type: Number, enum: [3,5,10], required: true },
price: { type: Number, required: true },
stock: { type: Number, required: true },
});
  

  const tagSchema = new Schema({
  name: { type: String, required: true },
  intensity: { type: Number, required: true, min: 1, max: 10 },
  slug: { type: String }
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
 brandSlug: { type: String },   
 variants: [variantSchema],
  category: { 
    type: String, 
    enum: ['hombre', 'mujer', 'unisex'], 
    required: true 
  },
  categorySlug: { type: String },
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
    enum: ['en_stock', 'poco_stock', 'sin_stock'],
    required: true
  },
  timeOfDay: {
    type: String,
    enum: ['día', 'noche', 'día_y_noche'],
    required: true
  },
   timeOfDaySlug: { type: String }, 
   seasons: {
    type: [String],
    enum: ['verano', 'otoño', 'invierno', 'primavera'],
    required: true,
    validate: [arr => arr.length > 0, 'Debe indicar al menos una temporada']
  },
   seasonsSlug: { type: [String] },
  ingredients: [ingredientSchema],
   tags: [tagSchema],
  averageRating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  sold: { 
    type: Number,
     default: 0 
    },
}, { timestamps: true }); 

productSchema.pre("save", function(next) {
  if (this.isModified("brand")) this.brandSlug = slugify(this.brand);
  if (this.isModified("category")) this.categorySlug = slugify(this.category);
  if (this.isModified("timeOfDay")) this.timeOfDaySlug = slugify(this.timeOfDay);
  if (this.isModified("seasons")) this.seasonsSlug = this.seasons.map(s => slugify(s));
  if (this.isModified("tags")) this.tags = this.tags.map(t => ({ ...t, slug: slugify(t.name) }));
  
  next();
});

const Product = mongoose.model('Products', productSchema);

export default Product;