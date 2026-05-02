const mongoose = require('mongoose');

const DEFAULT_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp_automation';

/**
 * Connect to MongoDB with retry logic.
 * Does not call process.exit on initial failure — it will retry.
 */
const connectDB = async (uri = DEFAULT_URI, opts = {}) => {
  const maxRetries = 10;
  let attempt = 0;

  const connectOnce = async () => {
    try {
      attempt++;
      const conn = await mongoose.connect(uri, opts);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return true;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt} failed:`, error.message || error);
      return false;
    }
  };

  while (attempt < maxRetries) {
    const ok = await connectOnce();
    if (ok) return;
    const waitMs = 2000 * attempt + 1000;
    console.log(`Retrying MongoDB connection in ${waitMs}ms...`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  // Final attempt (will throw if fails) to surface error to caller
  try {
    const conn = await mongoose.connect(uri, opts);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    console.error('MongoDB final connection attempt failed:', error);
    // Do not exit the process here; allow the rest of the app to handle a disconnected DB.
    // Throw so callers can decide what to do.
    throw error;
  }
};

module.exports = connectDB;
