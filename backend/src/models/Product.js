const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 140 },
    description: { type: String, required: [true, 'Description is required'], maxlength: 4000 },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    category: { type: String, required: [true, 'Category is required'], trim: true, index: true },
    brand: { type: String, trim: true, default: '' },
    stock: { type: Number, required: true, default: 0, min: [0, 'Stock cannot be negative'] },
    // Only Cloudinary URLs are stored — never raw files
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String },
      },
    ],
    // Owner/seller reference — Sales Persons can only manage products they own
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text index for keyword search across name / description / brand / category
productSchema.index({ name: 'text', description: 'text', brand: 'text', category: 'text' });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);
