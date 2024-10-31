const express = require('express');
const router = express.Router();
const Data = require('../models/Data');

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

    console.log('Recieved Data:', req.body);

    const newPoint = new Data({ name, location });

    try {
        const savedPoint = await newPoint.save();
        // Send back created document
        res.status(201).json(savedPoint);
        console.log(`Added point ${newPoint.name}`)
    } catch (error) {
        res.status(400).json({ message: 'Error saving point'});
    }
})

module.exports = router;
