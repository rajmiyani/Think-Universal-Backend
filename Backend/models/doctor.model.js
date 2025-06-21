import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [false, 'First name is required'],
        minlength: [2, 'First name must be at least 2 characters'],
        maxlength: [15, 'First name must be at most 15 characters'],
        trim: true
    },
    lastName: {
        type: String,
        required: [false, 'Last name is required'],
        minlength: [2, 'Last name must be at least 2 characters'],
        maxlength: [15, 'Last name must be at most 15 characters'],
        trim: true
    },
    email: {
        type: String,
        required: [false, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    phoneNo: {
        type: String, // Changed to String for international support
        required: [false, 'Phone number is required'],
        match: [/^[0-9]{10,15}$/, 'Phone number must be 10-15 digits']
    },
    speciality: {  // Added from your request
        type: String,
        required: [true, 'Speciality is required'],
        minlength: [2, 'Speciality must be at least 2 characters'],
        maxlength: [50, 'Speciality must be at most 50 characters'],
        trim: true
    },
    degree: {  // Added from your request
        type: String,
        required: [true, 'Degree is required'],
        trim: true
    },
    experience: {
        type: String,
        min: [0, 'Experience cannot be negative'],
        max: [80, 'Experience cannot exceed 80 years'],
        required: [true, 'Experience is required']
    },
    clinicAddress: {  // Added from your request
        type: String,
        required: [true, 'Clinic address is required'],
        trim: true
    },
    city: {  // Added from your request
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    state: {  // Added from your request
        type: String,
        required: [true, 'State is required'],
        trim: true
    },
    pincode: {  // Added from your request
        type: String,
        required: [true, 'Pincode is required'],
        match: [/^[0-9]{6}$/, 'Pincode must be 6 digits']
    },
    bio: {  // Added from your request
        type: String,
        maxlength: [2000, 'Bio cannot exceed 2000 characters'],
        trim: true
    },
    avatar: {  // Added from your request (replaces img)
        data: Buffer,
        contentType: String
    },
    totalPatient: {
        type: Number,
        min: [0, 'Patient count cannot be negative'],
        default: 0
    },
    rating: {
        type: Number,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5'],
        default: 0
    },
    gender: {
        type: String,
        enum: {
            values: ['Male', 'Female', 'Other'],
            message: 'Gender must be Male, Female, or Other'
        },
        required: [true, 'Gender is required']
    },
    about: {
        type: String,
        maxlength: [2000, 'About section cannot exceed 2000 characters'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'] // Increased security
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
            match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format']
        },
        bankName: {
            type: String,
            trim: true,
            minlength: [2, 'Bank name must be at least 2 characters'],
            maxlength: [100, 'Bank name must be at most 100 characters']
        },
        upiId: {
            type: String,
            match: [/^[\w.-]+@[\w.-]+$/, 'Invalid UPI ID format']
        }
    },
    role: {
        type: String,
        enum: {
            values: ['doctor', 'admin'],
            message: 'Role must be doctor or admin'
        },
        default: 'doctor'
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.password;  // Never send password in responses
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Compound index for faster queries
doctorSchema.index({ email: 1 }, { unique: true });
doctorSchema.index({ speciality: 1, city: 1, state: 1 });

export default mongoose.model('Doctor', doctorSchema);
