import mongoose from 'mongoose';
import { adminDB } from '../config/mongoose.js';

const authSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ['main-doctor', 'sub-doctor'],
        required: true
    },
    createdBy: {
        type: String,
        default: 'Urvesh Chauhan'
    }
}, { timestamps: true });

const Auth = adminDB.models.Auth || adminDB.model('Auth', authSchema);
export default Auth