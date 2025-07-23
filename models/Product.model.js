import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required']
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  height: {
    type: Number,
    required: [true, 'Height is required'],
    min: [1, 'Height must be at least 1 cm']
  },
  width: {
    type: Number,
    required: [true, 'Width is required'],
    min: [1, 'Width must be at least 1 cm']
  },
  depth: {
    type: Number,
    min: [1, 'Depth must be at least 1 cm']
  },
  material: {
    type: String,
    required: [true, 'Material is required'],
    enum: {
      values: ['leather', 'plastic', 'fabric', 'aluminum', 'carbon-fiber'],
      message: 'Material must be one of: leather, plastic, fabric, aluminum, carbon-fiber'
    }
  },
  rate: {
    type: Number,
    required: [true, 'Rate is required'],
    min: [0, 'Rate cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 1
  },
  isSold: {
    type: Boolean,
    default: false
  },
  features: [{
    type: String,
    trim: true
  }],
  color: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
productSchema.index({ seller: 1, isSold: 1 });
productSchema.index({ material: 1 });

// Virtual for product dimensions
productSchema.virtual('dimensions').get(function() {
  return `${this.height} x ${this.width}${this.depth ? ` x ${this.depth}` : ''} cm`;
});

// Pre-save middleware to handle sold products
productSchema.pre('save', function(next) {
  if (this.isSold && this.stock > 0) {
    this.stock = 0;
  }
  next();
});

export default mongoose.model('Product', productSchema);