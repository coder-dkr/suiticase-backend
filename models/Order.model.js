import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer is required']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ['cod', 'online'],
      message: 'Payment method must be either cod or online'
    },
    required: [true, 'Payment method is required']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      message: 'Status must be one of: pending, confirmed, shipped, delivered, cancelled'
    },
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'paid', 'failed', 'refunded'],
      message: 'Payment status must be one of: pending, paid, failed, refunded'
    },
    default: 'pending'
  },
  shippingAddress: {
    type: String,
    required: [true, 'Shipping address is required']
  },
  orderNotes: {
    type: String,
    maxlength: [200, 'Order notes cannot exceed 200 characters']
  }
}, {
  timestamps: true
});


orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ product: 1 });


orderSchema.pre('save', function(next) {
  if (this.isNew) {
    this.orderNumber = `TSM${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

export default mongoose.model('Order', orderSchema);