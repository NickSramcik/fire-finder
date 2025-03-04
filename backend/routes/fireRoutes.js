import express from 'express';
const router = express.Router();
import upload from '../middleware/multer.js';
import { addFire } from '../controllers/fireController.js';
import Data from '../models/Data.js';

// Route to add a fire with file upload
router.post("/api/addFire", upload.single("file"), addFire);

// Get all data points
router.get('/', async (req, res) => {
    try {
        const data = await Data.find({});
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Post a new data point
router.post('/', async (req, res) => {
    const { name, location } = req.body;

    console.log('Received Data:', req.body);

    const newPoint = new Data({ name, location });

    try {
        const savedPoint = await newPoint.save();
        res.status(201).json(savedPoint);
        console.log(`Added point ${newPoint.name}`);
    } catch (error) {
        res.status(400).json({ message: 'Error saving point' });
    }
});

export default router;
