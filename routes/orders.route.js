import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validate, orderSchema } from '../middleware/validation.middleware.js';
import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import mongoose from 'mongoose';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Place new order
// @route   POST /api/orders
// @access  Private/Buyer
router.post('/', authorize('buyer'), validate(orderSchema), async (req, res) => {
  try {
    const { product: productId, quantity = 1, paymentMethod, shippingAddress, orderNotes } = req.body;

    // Check if product exists and is available
    const product = await Product.findById(productId).populate('seller', 'email');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.isSold) {
      return res.status(400).json({
        success: false,
        message: 'Product is already sold'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${product.stock} items available`
      });
    }

    // Calculate total amount
    const totalAmount = product.rate * quantity;

    // Create order
    const order = new Order({
      buyer: req.user._id,
      product: productId,
      quantity,
      totalAmount,
      paymentMethod,
      shippingAddress,
      orderNotes
    });

    await order.save();

    // Update product stock
    product.stock -= quantity;
    if (product.stock === 0) {
      product.isSold = true;
    }
    await product.save();

    // Populate order details
    await order.populate([
      { path: 'buyer', select: 'email role' },
      { path: 'product', select: 'name material rate height width' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place order'
    });
  }
});

// @desc    Get buyer's orders
// @route   GET /api/orders
// @access  Private/Buyer
router.get('/', authorize('buyer'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sort = '-createdAt' } = req.query;
    
    // Build query
    const query = { buyer: req.user._id };
    
    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const orders = await Order.find(query)
      .populate('buyer', 'email role')
      .populate('product', 'name material rate height width seller')
      .populate('product.seller', 'email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders'
    });
  }
});

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private/Buyer
router.get('/:id', authorize('buyer'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findOne({ 
      _id: id, 
      buyer: req.user._id 
    })
    .populate('buyer', 'email role')
    .populate({
      path: 'product',
      select: 'name material rate height width seller',
      populate: {
        path: 'seller',
        select: 'email'
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order'
    });
  }
});

// @desc    Cancel order
// @route   PATCH /api/orders/:id/cancel
// @access  Private/Buyer
router.patch('/:id/cancel', authorize('buyer'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findOne({ 
      _id: id, 
      buyer: req.user._id 
    }).populate('product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be cancelled'
      });
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    // Restore product stock
    const product = await Product.findById(order.product._id);
    if (product) {
      product.stock += order.quantity;
      product.isSold = false;
      await product.save();
    }

    await order.populate([
      { path: 'buyer', select: 'email role' },
      { 
        path: 'product', 
        select: 'name material rate height width seller',
        populate: { path: 'seller', select: 'email' }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
});

// @desc    Get buyer dashboard stats
// @route   GET /api/orders/dashboard
// @access  Private/Buyer
router.get('/dashboard/stats', authorize('buyer'), async (req, res) => {
  try {
    const buyerId = req.user._id;

    // Get order statistics
    const totalOrders = await Order.countDocuments({ buyer: buyerId });
    const pendingOrders = await Order.countDocuments({ buyer: buyerId, status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ buyer: buyerId, status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ buyer: buyerId, status: 'cancelled' });

    // Get total amount spent
    const totalSpentResult = await Order.aggregate([
      { $match: { buyer: mongoose.Types.ObjectId(buyerId), status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalSpent: { $sum: '$totalAmount' } } }
    ]);
    const totalSpent = totalSpentResult[0]?.totalSpent || 0;

    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: { buyer: mongoose.Types.ObjectId(buyerId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent orders
    const recentOrders = await Order.find({ buyer: buyerId })
      .populate('product', 'name material rate')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('totalAmount status paymentMethod createdAt');

    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        stats: {
          totalOrders,
          pendingOrders,
          deliveredOrders,
          cancelledOrders,
          totalSpent
        },
        ordersByStatus,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data'
    });
  }
});

export default router;