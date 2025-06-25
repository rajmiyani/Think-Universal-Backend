import mongoose from 'mongoose';
import validator from 'validator';

const authSchema = new mongoose.Schema({
    // main_email: {
    //     type: String,
    //     lowercase: true,
    //     trim: true,
    //     validate: {
    //         validator: validator.isEmail,
    //         message: 'Please provide a valid email address'
    //     }
    // },
    // main_password: {
    //     type: String,
    //     minlength: [6, 'Password must be at least 6 characters long']
    // },
    // sub_email: {
    //     type: String,
    //     lowercase: true,
    //     trim: true,
    //     validate: {
    //         validator: validator.isEmail,
    //         message: 'Please provide a valid email address'
    //     }
    // },
    // sub_password: {
    //     type: String,
    //     minlength: [6, 'Password must be at least 6 characters long']
    // },
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth',
        default: null
    }
}, { timestamps: true });

export default mongoose.model('Auth', authSchema);
