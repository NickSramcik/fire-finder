import { connectDB } from '../utils/db';

export default defineNitroPlugin(async () => {
  try {
    await connectDB();
    // console.log('Database connected successfully on startup');
  } catch (error) {
    console.error('Failed to connect to database on startup:', error);
  }
});
