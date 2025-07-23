import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validate, productSchema } from '../middleware/validation.middleware.js';
import Product from '../models/Product.model.js';
import mongoose from 'mongoose';

const router = express.Router();

router.use(protect);
router.use(authorize('seller'));

// @route   POST /api/v1/seller/products
router.post('/products', validate(productSchema), async (req, res) => {
  try {
    const productData = {
      ...req.body,
      seller: req.user._id
    };

    const product = new Product(productData);
    await product.save();
    
    // Populate seller information
    await product.populate('seller', 'email role');

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      data: product
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product'
    });
  }
});

// @route   GET /api/v1/seller/products
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 10, material, isSold, sort = '-createdAt' } = req.query;
    
    const query = { seller: req.user._id };
    
    if (material) {
      query.material = material;
    }
    
    if (isSold !== undefined) {
      query.isSold = isSold === 'true';
    }

    const products = await Product.find(query)
      .populate('seller', 'email role')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

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
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products'
    });
  }
});

// @route   GET /api/v1/seller/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findOne({ 
      _id: id, 
      seller: req.user._id 
    }).populate('seller', 'email role');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product'
    });
  }
});


// @route   PATCH /api/v1/seller/products/:id
router.patch('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Don't allow updating seller field
    delete updates.seller;

    const product = await Product.findOneAndUpdate(
      { _id: id, seller: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('seller', 'email role');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});


// @route   PATCH /api/v1/seller/products/:id/sold
router.patch('/products/:id/sold', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, seller: req.user._id },
      { isSold: true, stock: 0 },
      { new: true, runValidators: true }
    ).populate('seller', 'email role');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product marked as sold successfully',
      data: product
    });
  } catch (error) {
    console.error('Mark sold error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark product as sold'
    });
  }
});


// @route   DELETE /api/v1/seller/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findOneAndDelete({ 
      _id: id, 
      seller: req.user._id 
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});


// @route   PATCH /api/v1seller/rates
router.patch('/rates', async (req, res) => {
  try {
    const { material, increase, percentage } = req.query;

    if (!material) {
      return res.status(400).json({
        success: false,
        message: 'Material parameter is required'
      });
    }

    if (!increase && !percentage) {
      return res.status(400).json({
        success: false,
        message: 'Either increase amount or percentage is required'
      });
    }

    // Build update query
    let updateQuery = {};
    
    if (increase) {
      updateQuery.$inc = { rate: parseFloat(increase) };
    } else if (percentage) {
      // For percentage increase, we need to use aggregation pipeline
      const products = await Product.find({ 
        seller: req.user._id, 
        material: material 
      });
      
      const bulkOps = products.map(product => ({
        updateOne: {
          filter: { _id: product._id },
          update: { 
            $set: { 
              rate: Math.round(product.rate * (1 + parseFloat(percentage) / 100) * 100) / 100 
            } 
          }
        }
      }));

      if (bulkOps.length > 0) {
        const result = await Product.bulkWrite(bulkOps);
        return res.status(200).json({
          success: true,
          message: `Rates updated successfully for ${result.modifiedCount} ${material} products`,
          data: {
            material,
            productsUpdated: result.modifiedCount,
            percentageIncrease: parseFloat(percentage)
          }
        });
      } else {
        return res.status(404).json({
          success: false,
          message: `No ${material} products found`
        });
      }
    }

    // For fixed amount increase
    const result = await Product.updateMany(
      { seller: req.user._id, material: material },
      updateQuery
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: `No ${material} products found`
      });
    }

    res.status(200).json({
      success: true,
      message: `Rates updated successfully for ${result.modifiedCount} ${material} products`,
      data: {
        material,
        productsUpdated: result.modifiedCount,
        rateIncrease: parseFloat(increase)
      }
    });
  } catch (error) {
    console.error('Bulk update rates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product rates'
    });
  }
});


// @route   GET /api/v1/seller/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Get product statistics
    const totalProducts = await Product.countDocuments({ seller: sellerId });
    const soldProducts = await Product.countDocuments({ seller: sellerId, isSold: true });
    const availableProducts = totalProducts - soldProducts;

    // Get products by material
    const productsByMaterial = await Product.aggregate([
      { $match: { seller: mongoose.Types.ObjectId(sellerId) } },
      { $group: { _id: '$material', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent products
    const recentProducts = await Product.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name material rate isSold createdAt');

    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        stats: {
          totalProducts,
          soldProducts,
          availableProducts,
          soldPercentage: totalProducts > 0 ? Math.round((soldProducts / totalProducts) * 100) : 0
        },
        productsByMaterial,
        recentProducts
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