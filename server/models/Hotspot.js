import { Schema, model } from 'mongoose';

const hotspotSchema = new Schema(
    {
        geometry: {
            type: {
                type: String,
                enum: ['Point'],
                required: true,
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true,
            },
        },
        properties: {
            sourceId: String,
            brightness: Number, // Kelvin temperature
            confidence: Number, // 0-100 confidence score
            satellite: String, // 'VIIRS' or 'MODIS'
            acquisitionDate: Date,
            scan: Number, // Pixel size
            track: Number, // Pixel size
            frp: Number, // Fire Radiative Power (MW)
            daynight: String, // 'D' or 'N' for Day and Night, respectively
            source: {
                type: String,
                default: 'NASA_FIRMS',
            },
        },
    },
    { timestamps: true }
);

hotspotSchema.index({ geometry: '2dsphere' });
hotspotSchema.index({ 'properties.acquisitionDate': -1 });
hotspotSchema.index({ 'properties.confidence': -1 });

export default model('Hotspot', hotspotSchema);
