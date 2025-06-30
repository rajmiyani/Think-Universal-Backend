import mongoose from 'mongoose';
import { adminDB } from '../config/mongoose.js';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    phone_number: {
        type: Number,
        required: true,
        match: [/^\d{10}$/, 'Invalid mobile number']
    },
    mobile: {
        type: Number,
        required: true,
        match: [/^\d{10}$/, 'Invalid mobile number']
    },
    role: {
        type: String,
        enum: ['main', 'sub', 'user'],
        default: 'user'
    }
}, {
    timestamps: true
});

const User = adminDB.models.User || adminDB.model('User', userSchema);
export default User;