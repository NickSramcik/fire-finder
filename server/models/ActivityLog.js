import { Schema, model } from 'mongoose';

const activityLogSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['success', 'error', 'reset'],
            required: true,
        },
        source: {
            type: String,
            enum: ['fire', 'perimeter', 'hotspot'],
            required: true,
        },
        trigger: {
            type: String,
            enum: ['auto', 'manual'],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        details: {
            type: Schema.Types.Mixed,
            default: null,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        // Capped collection — MongoDB automatically evicts oldest docs once
        // the limit is reached. Size (bytes) is required; max sets doc count.
        capped: { size: 51200, max: 50 },
        timestamps: false,
    }
);

export default model('ActivityLog', activityLogSchema);
