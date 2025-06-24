import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
    prescriptionNote: {
        type: String,
        required: [true, 'Prescription note is required'],
        trim: true,
        minlength: [10, 'Prescription note must be at least 10 characters'],
        maxlength: [2000, 'Prescription note cannot exceed 2000 characters']
    },
    patientMobile: {
        type: String,
        required: true,
        trim: true
    },
    createdBy: {
        type: String,
        required: [true, 'Created by (doctor) is required'],
        minlength: [3, 'Creator name/ID must be at least 3 characters'],
        maxlength: [100, 'Creator name/ID cannot exceed 100 characters'],
        trim: true,
        match: [/^[a-zA-Z0-9\s.'-]+$/, 'Creator name/ID contains invalid characters']
    }
}, {
    timestamps: true,          // ✅ ENABLE TIMESTAMPS (createdAt, updatedAt)
    versionKey: false
});

prescriptionSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('Prescription', prescriptionSchema);
