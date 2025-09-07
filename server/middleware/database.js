import { connectDB } from '../utils/db';
import mongoose from 'mongoose';


// Global connection variable
let isConnecting = false;
let connectionPromise = null;

export default defineEventHandler(async event => {
    // Only handle API routes
    if (!event.path.startsWith('/api/')) {
        return;
    }

    try {
        // Check if mongoose is already connected
        if (mongoose.connection.readyState === 1) {
            return; // Already connected
        }

        // Prevent multiple simultaneous connection attempts
        if (!isConnecting) {
            isConnecting = true;
            connectionPromise = connectDB();
        }

        // Wait for connection to establish
        await connectionPromise;
        isConnecting = false;
    } catch (error) {
        console.error('Database connection failed:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Database connection failed',
        });
    }
});
