import mongoose from 'mongoose';
import { adminDB } from '../config/mongoose.js';
import bcrypt from 'bcrypt';

const doctorSchema = new mongoose.Schema({
    firstName: {
        type: String,
        minlength: [2, 'First name must be at least 2 characters'],
        maxlength: [15, 'First name must be at most 15 characters'],
        trim: true
    },
    lastName: {
        type: String,
        minlength: [2, 'Last name must be at least 2 characters'],
        maxlength: [15, 'Last name must be at most 15 characters'],
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
    },
    phoneNo: {
        type: String,
        match: [/^[0-9]{10,15}$/, 'Phone number must be 10-15 digits']
    },
    speciality: String,
    degree: String,
    experience: {
        type: String,
        required: true
    },
    clinicAddress: String,
    city: String,
    state: String,
    pincode: {
        type: String,
        match: [/^[0-9]{6}$/, 'Pincode must be 6 digits']
    },
    bio: {
        type: String,
        maxlength: 2000
    },
    avatar: {
        data: Buffer,
        contentType: String
    },
    totalPatient: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    about: {
        type: String,
        maxlength: 2000
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        default: null
    },
    bankDetails: {
        accountNumber: {
            type: String,
            match: [/^\d{9,18}$/, 'Account number must be 9-18 digits']
        },
        ifscCode: {
            type: String,
            match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code']
        },
        bankName: String,
        upiId: {
            type: String,
            match: [/^[\w.-]+@[\w.-]+$/, 'Invalid UPI ID']
        }
    },
    role: {
        type: String,
        enum: ['main', 'sub'],
        default: 'sub'
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// 🔐 Auto-hash password before save
doctorSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        return next();
    } catch (err) {
        return next(err);
    }
});

doctorSchema.index({ email: 1 }, { unique: true });

export default adminDB.model('Doctor', doctorSchema);
