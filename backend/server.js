import express, { json } from 'express';
import cors from 'cors';
import { connect } from 'mongoose';
import dataRoutes from './routes/dataRoutes.js';
import fireRoutes from './routes/fireRoutes.js';

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(json());
app.use(cors());

// Database Connection
connect(process.env.DB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Mongo DB connection error:', err));

// Routes
app.use('/api/data', dataRoutes);
app.use('/api/fire', fireRoutes);

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
