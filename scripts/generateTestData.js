import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import User from '../models/User.model.js';
import Product from '../models/Product.model.js';
import Order from '../models/Order.model.js';

config();


const sampleUsers = [
  // Admin users
  {
    email: 'admin@thangabali.com',
    password: 'admin123',
    role: 'admin',
    isVerified: true
  },
  {
    email: 'superadmin@thangabali.com',
    password: 'admin123',
    role: 'admin',
    isVerified: true
  },
  
  // Seller users
  {
    email: 'john.seller@example.com',
    password: 'seller123',
    role: 'seller',
    isVerified: true
  },
  {
    email: 'sarah.premium@example.com',
    password: 'seller123',
    role: 'seller',
    isVerified: true
  },
  {
    email: 'mike.luggage@example.com',
    password: 'seller123',
    role: 'seller',
    isVerified: true
  },
  {
    email: 'emma.cases@example.com',
    password: 'seller123',
    role: 'seller',
    isVerified: true
  },
  {
    email: 'david.travel@example.com',
    password: 'seller123',
    role: 'seller',
    isVerified: false // One unverified seller
  },
  
  // Buyer users
  {
    email: 'alice.buyer@example.com',
    password: 'buyer123',
    role: 'buyer',
    isVerified: true
  },
  {
    email: 'bob.traveler@example.com',
    password: 'buyer123',
    role: 'buyer',
    isVerified: true
  },
  {
    email: 'carol.explorer@example.com',
    password: 'buyer123',
    role: 'buyer',
    isVerified: true
  },
  {
    email: 'daniel.nomad@example.com',
    password: 'buyer123',
    role: 'buyer',
    isVerified: true
  },
  {
    email: 'eva.wanderer@example.com',
    password: 'buyer123',
    role: 'buyer',
    isVerified: true
  },
  {
    email: 'frank.tourist@example.com',
    password: 'buyer123',
    role: 'buyer',
    isVerified: false // One unverified buyer
  }
];

const sampleProducts = [
  // Leather suitcases
  {
    name: 'Premium Leather Executive Suitcase',
    description: 'Handcrafted Italian leather suitcase perfect for business travel. Features multiple compartments and TSA-approved locks.',
    height: 55,
    width: 35,
    depth: 25,
    material: 'leather',
    rate: 299.99,
    stock: 15,
    features: ['TSA Lock', 'Multiple Compartments', 'Leather Handle', 'Wheels'],
    color: 'Brown'
  },
  {
    name: 'Vintage Leather Travel Case',
    description: 'Classic vintage-style leather suitcase with brass fittings and premium interior lining.',
    height: 60,
    width: 40,
    depth: 20,
    material: 'leather',
    rate: 450.00,
    stock: 8,
    features: ['Brass Fittings', 'Silk Lining', 'Vintage Style', 'Leather Straps'],
    color: 'Black'
  },
  {
    name: 'Compact Leather Carry-On',
    description: 'Perfect size for airline carry-on restrictions. Made from genuine leather with modern features.',
    height: 45,
    width: 30,
    depth: 20,
    material: 'leather',
    rate: 199.99,
    stock: 25,
    features: ['Carry-On Size', 'Genuine Leather', 'Spinner Wheels', 'Expandable'],
    color: 'Tan'
  },
  
  // Plastic suitcases
  {
    name: 'Durable Hard Shell Suitcase',
    description: 'Ultra-lightweight yet durable plastic shell suitcase with 360-degree spinner wheels.',
    height: 65,
    width: 45,
    depth: 25,
    material: 'plastic',
    rate: 89.99,
    stock: 50,
    features: ['Hard Shell', 'Spinner Wheels', 'Lightweight', 'Scratch Resistant'],
    color: 'Blue'
  },
  {
    name: 'Colorful Travel Companion',
    description: 'Bright and cheerful plastic suitcase perfect for vacation travel. Available in multiple colors.',
    height: 70,
    width: 50,
    depth: 30,
    material: 'plastic',
    rate: 75.50,
    stock: 30,
    features: ['Bright Colors', 'Large Capacity', 'Easy Clean', 'Telescopic Handle'],
    color: 'Pink'
  },
  {
    name: 'Budget Friendly Plastic Case',
    description: 'Affordable yet reliable plastic suitcase for occasional travelers.',
    height: 55,
    width: 35,
    depth: 22,
    material: 'plastic',
    rate: 45.99,
    stock: 40,
    features: ['Budget Friendly', 'Basic Features', 'Lightweight', 'Durable'],
    color: 'Gray'
  },
  
  // Fabric suitcases
  {
    name: 'Soft Shell Fabric Suitcase',
    description: 'Flexible fabric construction with multiple external pockets for easy organization.',
    height: 60,
    width: 40,
    depth: 25,
    material: 'fabric',
    rate: 120.00,
    stock: 35,
    features: ['Soft Shell', 'External Pockets', 'Expandable', 'Water Resistant'],
    color: 'Navy'
  },
  {
    name: 'Canvas Adventure Bag',
    description: 'Rugged canvas suitcase designed for outdoor adventures and rough handling.',
    height: 65,
    width: 45,
    depth: 28,
    material: 'fabric',
    rate: 95.75,
    stock: 20,
    features: ['Canvas Material', 'Reinforced Corners', 'Adventure Ready', 'Multiple Straps'],
    color: 'Khaki'
  },
  {
    name: 'Lightweight Fabric Roller',
    description: 'Ultra-lightweight fabric suitcase with smooth-rolling wheels and comfortable grip.',
    height: 58,
    width: 38,
    depth: 23,
    material: 'fabric',
    rate: 85.99,
    stock: 28,
    features: ['Ultra Light', 'Smooth Wheels', 'Comfortable Grip', 'Spacious Interior'],
    color: 'Green'
  },
  
  // Aluminum suitcases
  {
    name: 'Professional Aluminum Case',
    description: 'Premium aluminum construction for maximum protection and professional appearance.',
    height: 55,
    width: 35,
    depth: 25,
    material: 'aluminum',
    rate: 350.00,
    stock: 12,
    features: ['Aluminum Body', 'Professional Look', 'Maximum Protection', 'Corner Guards'],
    color: 'Silver'
  },
  {
    name: 'Pilot Style Aluminum Suitcase',
    description: 'Aviation-inspired aluminum suitcase with reinforced corners and precision engineering.',
    height: 50,
    width: 35,
    depth: 20,
    material: 'aluminum',
    rate: 425.99,
    stock: 8,
    features: ['Aviation Style', 'Reinforced Corners', 'Precision Engineering', 'Pilot Approved'],
    color: 'Gunmetal'
  },
  
  // Carbon fiber suitcases
  {
    name: 'Ultra-Light Carbon Fiber Case',
    description: 'State-of-the-art carbon fiber construction offering maximum strength with minimum weight.',
    height: 55,
    width: 35,
    depth: 25,
    material: 'carbon-fiber',
    rate: 599.99,
    stock: 5,
    features: ['Carbon Fiber', 'Ultra Light', 'Maximum Strength', 'Premium Quality'],
    color: 'Black'
  },
  {
    name: 'Racing Edition Carbon Suitcase',
    description: 'Inspired by Formula 1 technology, this carbon fiber suitcase is the ultimate in travel luxury.',
    height: 60,
    width: 40,
    depth: 25,
    material: 'carbon-fiber',
    rate: 750.00,
    stock: 3,
    features: ['F1 Inspired', 'Racing Edition', 'Luxury Travel', 'Limited Edition'],
    color: 'Carbon Black'
  }
];

const generateTestData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    console.log('Existing data cleared');

    // Create users
    console.log('Creating users...');
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = new User({
        ...userData,
        password: hashedPassword,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        lastLogin: userData.isVerified ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null
      });
      
      await user.save();
      createdUsers.push(user);
      console.log(`   Created ${user.role}: ${user.email}`);
    }

    // Get sellers for product assignment
    const sellers = createdUsers.filter(user => user.role === 'seller' && user.isVerified);
    
    // Create products
    console.log('Creating products...');
    const createdProducts = [];
    
    for (const productData of sampleProducts) {
      const randomSeller = sellers[Math.floor(Math.random() * sellers.length)];
      
      const product = new Product({
        ...productData,
        seller: randomSeller._id,
        createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000), // Random date within last 20 days
        isSold: Math.random() < 0.2 // 20% chance of being sold
      });
      
      // If marked as sold, set stock to 0
      if (product.isSold) {
        product.stock = 0;
      }
      
      await product.save();
      createdProducts.push(product);
      console.log(`   ✓ Created product: ${product.name} (${product.material}) - $${product.rate}`);
    }

    // Get buyers for order assignment
    const buyers = createdUsers.filter(user => user.role === 'buyer' && user.isVerified);
    const availableProducts = createdProducts.filter(product => !product.isSold && product.stock > 0);
    
    // Create orders
    console.log('📦 Creating orders...');
    const orderStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    const paymentMethods = ['cod', 'online'];
    const sampleAddresses = [
      '123 Main St, New York, NY 10001',
      '456 Oak Ave, Los Angeles, CA 90210',
      '789 Pine Rd, Chicago, IL 60601',
      '321 Elm St, Houston, TX 77001',
      '654 Maple Dr, Phoenix, AZ 85001',
      '987 Cedar Ln, Philadelphia, PA 19101'
    ];
    
    const orderNotes = [
      'Please handle with care',
      'Urgent delivery needed',
      'Gift wrapping requested',
      'Leave at front door if not home',
      'Call before delivery',
      null // Some orders without notes
    ];

    // Create 25-30 random orders
    const numberOfOrders = 25 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < numberOfOrders; i++) {
      const randomBuyer = buyers[Math.floor(Math.random() * buyers.length)];
      const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
      
      // Skip if not enough stock
      if (randomProduct.stock < quantity) continue;
      
      const order = new Order({
        buyer: randomBuyer._id,
        product: randomProduct._id,
        quantity,
        totalAmount: randomProduct.rate * quantity,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        paymentStatus: Math.random() < 0.8 ? 'paid' : 'pending', // 80% paid
        shippingAddress: sampleAddresses[Math.floor(Math.random() * sampleAddresses.length)],
        orderNotes: orderNotes[Math.floor(Math.random() * orderNotes.length)],
        createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000) // Random date within last 15 days
      });
      
      await order.save();
      
      // Update product stock
      randomProduct.stock -= quantity;
      if (randomProduct.stock === 0) {
        randomProduct.isSold = true;
      }
      await randomProduct.save();
      
      console.log(`   ✓ Created order: ${randomBuyer.email} ordered ${quantity}x ${randomProduct.name}`);
    }

    // Display summary
    console.log('\nTest Data Generation Summary:');
    console.log('================================');
    
    const userCounts = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 }, verified: { $sum: { $cond: ['$isVerified', 1, 0] } } } }
    ]);
    
    userCounts.forEach(roleCount => {
      console.log(`${roleCount._id.toUpperCase()}: ${roleCount.count} total (${roleCount.verified} verified)`);
    });
    
    const productCounts = await Product.aggregate([
      { $group: { _id: '$material', count: { $sum: 1 }, sold: { $sum: { $cond: ['$isSold', 1, 0] } } } }
    ]);
    
    console.log('\nPRODUCTS BY MATERIAL:');
    productCounts.forEach(materialCount => {
      console.log(`${materialCount._id}: ${materialCount.count} total (${materialCount.sold} sold)`);
    });
    
    const totalOrders = await Order.countDocuments();
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log(`\nORDERS: ${totalOrders} total`);
    ordersByStatus.forEach(statusCount => {
      console.log(`${statusCount._id}: ${statusCount.count}`);
    });
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    console.log(`\nTOTAL REVENUE: $${totalRevenue[0]?.total?.toFixed(2) || '0.00'}`);
    
    console.log('\nTest data generation completed successfully!');
    console.log('\nSample Login Credentials:');
    console.log('============================');
    console.log('ADMIN: admin@thangabali.com / admin123');
    console.log('SELLER: john.seller@example.com / seller123');
    console.log('BUYER: alice.buyer@example.com / buyer123');
    console.log('\nAll verified users can login immediately!');
    
  } catch (error) {
    console.error('Error generating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
generateTestData();