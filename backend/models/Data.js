import mongoose from 'mongoose';

const dataSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true }
});

export default mongoose.model('Data', dataSchema); // Use default export
