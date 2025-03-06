import { Schema, model } from 'mongoose';

const fireSchema = new Schema({
    fireId: Number,
    sourceId: String,
    name: String,
    discoveredAt: Date,
    lastUpdated: Date,
    status: String,
    area: Number,
    containment: Number,
    cause: String,
    source: String,
    geometry: {
        type: {
          $type: String,
          enum: ['Point'],
          required: true
        },
        coordinates: {
          $type: [Number],
          required: true
        }
    }
}, { typeKey: '$type' }); // Fixes Mongoose confusing geoJSON "type" property with its own schema definitions

export default model('Fire', fireSchema);
