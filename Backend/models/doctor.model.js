import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [15, 'Name must be at most 15 characters'],
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [15, 'Name must be at most 15 characters'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address']
    },
    phoneNo: {
        type: Number,
        required: [true, 'Phone number is required'],
        match: [/^\d{10,15}$/, 'Phone number must be 10 digits']
    },
    destination: {
        type: String,
        required: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name must be at most 50 characters'],
        trim: true
    },
    totalPatient: {
        type: Number,
        min: 0,
        default: 0
    },
    experience: {
        type: Number,
        min: 0,
        max: 80,
        required: true
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
    review: {
        type: String,
        maxlength: 1000
    },
    img: {
        type: String,
        trim: true
    },
    about: {
        type: String,
        maxlength: 2000
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        default: null
    },
    bankDetails: {
        accountNumber: {
            type: String,
            // required: [true, 'Account number is required'],
            match: [/^\d{9,18}$/, 'Account number must be 9 to 18 digits']
        },
        ifscCode: {
            type: String,
            // required: [true, 'IFSC code is required'],
            match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format']
        },
        bankName: {
            type: String,
            // required: [true, 'Bank name is required'],
            trim: true,
            minlength: [2, 'Bank name must be at least 2 characters'],
            maxlength: [100, 'Bank name must be at most 100 characters']
        },
        upiId: {
            type: String,
            required: false,
            match: [/^[\w.-]+@[\w.-]+$/, 'Invalid UPI ID format']
        }
    },
    role: {
        type: String,
        enum: ['doctor', 'admin'],
        default: 'doctor'
    },
}, { timestamps: true });

export default mongoose.model('Doctor', doctorSchema);
