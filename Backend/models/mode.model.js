import mongoose from 'mongoose';

const modeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Mode name is required'],
        enum: {
            values: ['audio', 'video call', 'chat'],
            message: 'Mode name must be one of: audio, video call, chat'
        },
        trim: true,
        minlength: [4, 'Mode name must be at least 4 characters'],
        maxlength: [10, 'Mode name cannot exceed 10 characters']
    },
    currency: {
        type: String,
        required: [true, 'Currency is required'],
        enum: {
            values: ['USD', 'INR'],
            message: 'Currency must be USD or INR'
        }
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
        max: [100000, 'Price is unrealistically high']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false }
});

// Index for fast lookups
modeSchema.index({ name: 1, currency: 1 }, { unique: true });

export default mongoose.model('Mode', modeSchema);
