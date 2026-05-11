import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  discount: { type: String },
  image: { type: String },
  inStock: { type: Boolean, default: true },
  category: { type: String }
});

const SellerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: { type: String },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: { type: String },
  deliveryEta: { type: String },
  products: [ProductSchema],
  createdAt: { type: Date, default: Date.now }
});

// Index for Geospatial queries
SellerSchema.index({ location: '2dsphere' });

export default mongoose.model('Seller', SellerSchema);
