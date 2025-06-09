import mongoose from 'mongoose';

const authSchema = new mongoose.Schema({
    // firstName: {
    //     type: String,
    //     required: true,
    //     minlength: [2, 'Name must be at least 2 characters'],
    //     maxlength: [15, 'Name must be at most 15 characters'],
    //     trim: true
    // },
    // lastName: {
    //     type: String,
    //     required: true,
    //     minlength: [2, 'Name must be at least 2 characters'],
    //     maxlength: [15, 'Name must be at most 15 characters'],
    //     trim: true
    // },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address']
    },
    // phoneNo: {
    //     type: String,
    //     required: [true, 'Phone number is required'],
    //     match: [/^\d{10,15}$/, 'Phone number must be 10 to 15 digits']
    // },
    // destination: {
    //     type: String,
    //     required: true,
    //     minlength: [2, 'Name must be at least 2 characters'],
    //     maxlength: [50, 'Name must be at most 50 characters'],
    //     trim: true
    // },
    // experience: {
    //     type: String,
    //     min: 0,
    //     max: 80,
    //     required: true
    // },
    // gender: {
    //     type: String,
    //     enum: ['Male', 'Female', 'Other'],
    //     required: true
    // },
    // img: {
    //     type: String,
    //     trim: true
    // },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },    
}, { timestamps: true });

export default mongoose.model('Auth', authSchema);
