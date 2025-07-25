import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import Product from '../models/Product.model.js';
import mongoose from 'mongoose';

const router = express.Router();

// Apply protection and authorization middleware
router.use(protect);
router.use(authorize('buyer'));

// @route   GET /api/v1/buyer/products
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, material, isSold, sort = '-createdAt' } = req.query;

    // Define the query object
    const query = {};

    if (material) {
      query.material = material;
    }

    if (isSold !== undefined) {
      query.isSold = isSold === 'true';
    }

    // Fetch products with the query, sort, limit, and skip
    const products = await Product.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Count total documents matching the query
    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: {
        products,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
    });
  }
});

export default router;
