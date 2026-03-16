import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    name: String,
    avatar: String,
    provider: {
        type: String,
        enum: ['google', 'apple'],
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    homeLocation: {
        lat: Number,
        lng: Number,
        label: String,
    },
    settings: {
        // Reserved for future user preferences
    },
    lastLoginAt: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.index({ email: 1 });

export default model('User', userSchema);
