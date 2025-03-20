import { Schema, model } from 'mongoose';

const perimeterSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['Feature'], 
  },
  geometry: {
    type: {
      type: String,
      required: true,
      enum: ['Polygon', 'MultiPolygon'],
    },
    coordinates: {
      type: Array,
      required: true,
    },
  },
  properties: {
    name: {
      type: String,
      required: true,
    },
  },
}); 

// perimeterSchema.index({ geometry: '2dsphere' }); // Disabled until solution for polygons with holes, breaks this index TODO

export default model('Perimeter', perimeterSchema);
