import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
    // reportId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Report',
    //     required: [false, 'Report reference is required'],
    //     validate: {
    //         validator: function (v) {
    //             return mongoose.Types.ObjectId.isValid(v);
    //         },
    //         message: 'Invalid Report ID format'
    //     }
    // },
    prescriptionNote: {
        type: String,
        required: [true, 'Prescription note is required'],
        trim: true,
        minlength: [10, 'Prescription note must be at least 10 characters'],
        maxlength: [2000, 'Prescription note cannot exceed 2000 characters']
    },
    createdBy: {
        type: String, // If you use ObjectId for doctor reference, change to mongoose.Schema.Types.ObjectId and add ref
        required: [true, 'Created by (doctor) is required'],
        minlength: [3, 'Creator name/ID must be at least 3 characters'],
        maxlength: [100, 'Creator name/ID cannot exceed 100 characters'],
        trim: true,
        match: [/^[a-zA-Z0-9\s.'-]+$/, 'Creator name/ID contains invalid characters']
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true // Prevents modification after creation
    }
}, { timestamps: false, versionKey: false });

// Index for efficient queries by report and creator
prescriptionSchema.index({ reportId: 1, createdBy: 1 });

// Sanitize output: remove any internal fields
prescriptionSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('Prescription', prescriptionSchema);
