import mongoose from 'mongoose';
import validator from 'validator';

const authSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: validator.isEmail,
            message: 'Please provide a valid email address'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    role: {
        type: String,
        enum: ['main-doctor', 'sub-doctor'],
        default: 'sub-doctor'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        default: null
    }
}, { timestamps: true });

export default mongoose.model('Auth', authSchema);
