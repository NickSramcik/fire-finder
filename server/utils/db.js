import mongoose from 'mongoose';

// Remove the isConnected check as it can cause issues with connection pooling
// and doesn't work well in serverless environments

export const connectDB = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    
    if (!dbUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Use more robust connection options
    const db = await mongoose.connect(dbUri, {
      useNewUrlParser: true,
    });

    console.log('MongoDB connected successfully');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Close connection on app termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed through app termination');
  process.exit(0);
});