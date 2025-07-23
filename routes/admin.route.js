import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import User from '../models/User.model.js';
import Product from '../models/Product.model.js';
import Order from '../models/Order.model.js';
import mongoose from 'mongoose';

const router = express.Router();


router.use(protect);
router.use(authorize('admin'));

router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 10, sort = '-createdAt', search } = req.query;
    
    // Build query
    const query = {};
    
    if (role && ['admin', 'seller', 'buyer'].includes(role)) {
      query.role = role;
    }

    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password') // Exclude password field
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
});


router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional user statistics
    let userStats = {};
    
    if (user.role === 'seller') {
      const totalProducts = await Product.countDocuments({ seller: id });
      const soldProducts = await Product.countDocuments({ seller: id, isSold: true });
      userStats = { totalProducts, soldProducts };
    } else if (user.role === 'buyer') {
      const totalOrders = await Order.countDocuments({ buyer: id });
      const totalSpentResult = await Order.aggregate([
        { $match: { buyer: mongoose.Types.ObjectId(id), status: { $ne: 'cancelled' } } },
        { $group: { _id: null, totalSpent: { $sum: '$totalAmount' } } }
      ]);
      const totalSpent = totalSpentResult[0]?.totalSpent || 0;
      userStats = { totalOrders, totalSpent };
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user,
        stats: userStats
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user'
    });
  }
});

// @desc    Delete user by ID
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Prevent admin from deleting themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Start a transaction to handle related data
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // If deleting a seller, also delete their products
        if (user.role === 'seller') {
          await Product.deleteMany({ seller: id }).session(session);
        }
        
        // If deleting a buyer, cancel their pending orders
        if (user.role === 'buyer') {
          await Order.updateMany(
            { buyer: id, status: 'pending' },
            { status: 'cancelled' }
          ).session(session);
        }
        
        // Delete the user
        await User.findByIdAndDelete(id).session(session);
      });

      await session.endSession();

      res.status(200).json({
        success: true,
        message: `User and related data deleted successfully`
      });
    } catch (error) {
      await session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});


// @route   PATCH /api/v1/admin/users/:id/status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isVerified must be a boolean value'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isVerified },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});


// @route   GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = totalUsers - verifiedUsers;

    // Get users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get product statistics
    const totalProducts = await Product.countDocuments();
    const soldProducts = await Product.countDocuments({ isSold: true });
    const availableProducts = totalProducts - soldProducts;

    // Get products by material
    const productsByMaterial = await Product.aggregate([
      { $group: { _id: '$material', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get order statistics
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const completedOrders = await Order.countDocuments({ status: 'delivered' });

    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get total revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Get recent activities
    const recentUsers = await User.find()
      .select('email role isVerified createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentOrders = await Order.find()
      .populate('buyer', 'email')
      .populate('product', 'name')
      .select('totalAmount status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      message: 'Admin dashboard data retrieved successfully',
      data: {
        userStats: {
          totalUsers,
          verifiedUsers,
          unverifiedUsers,
          usersByRole
        },
        productStats: {
          totalProducts,
          soldProducts,
          availableProducts,
          productsByMaterial
        },
        orderStats: {
          totalOrders,
          pendingOrders,
          completedOrders,
          ordersByStatus,
          totalRevenue
        },
        recentActivities: {
          recentUsers,
          recentOrders
        }
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data'
    });
  }
});

// @desc    Get system health and metrics
// @route   GET /api/admin/system
// @access  Private/Admin
router.get('/system', async (req, res) => {
  try {
    // Database connection status
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryInMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
    };

    // Uptime
    const uptimeSeconds = process.uptime();
    const uptime = {
      days: Math.floor(uptimeSeconds / 86400),
      hours: Math.floor((uptimeSeconds % 86400) / 3600),
      minutes: Math.floor((uptimeSeconds % 3600) / 60),
      seconds: Math.floor(uptimeSeconds % 60)
    };

    res.status(200).json({
      success: true,
      message: 'System information retrieved successfully',
      data: {
        database: {
          status: dbStatus,
          name: mongoose.connection.name || 'N/A'
        },
        server: {
          nodeVersion: process.version,
          platform: process.platform,
          environment: process.env.NODE_ENV,
          uptime,
          memory: memoryInMB
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('System info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system information'
    });
  }
});

export default router;