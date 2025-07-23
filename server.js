import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './db/db.js';

dotenv.config();


import authRoutes from './routes/auth.route.js';
import sellerRoutes from './routes/seller.route.js';
import orderRoutes from './routes/orders.route.js';
import adminRoutes from './routes/admin.route.js';
import productRoutes from './routes/product.route.js';


import errorHandler from './middleware/errorHandler.middleware.js';

const app = express();


app.use(helmet());
app.use(cors('*'));


// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: 'Too many requests from this IP, please try again later'
// });
// app.use(limiter);


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


connectDB();


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/seller', sellerRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/products', productRoutes);


app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'UP AND RUNNING',
    timestamp: new Date().toISOString()
  });
});


app.use(errorHandler);


app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});


server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    const altPort = PORT + 1;
    console.log(`Trying alternative port ${altPort}...`);
    app.listen(altPort);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});

// Handle process termination
process.on('SIGTERM', async () => {
  await disconnectDB();
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;