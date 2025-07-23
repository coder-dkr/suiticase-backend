import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB is already connected');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  if (process.env.NODE_ENV === 'development') return; 
  if (!isConnected) return;
  
  await mongoose.disconnect();
  isConnected = false;
  console.log('MongoDB disconnected');
};

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});