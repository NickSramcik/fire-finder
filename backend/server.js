const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dataRoutes = require('./routes/dataRoutes');

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
mongoose.connect(process.env.DB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Mongo DB connection error:', err));

// Routes
app.use('/api/data', dataRoutes);

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
