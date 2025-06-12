import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: [true, 'Report date is required'],
        validate: {
            validator: function (v) {
                // Date must not be in the past
                return v && v >= new Date().setHours(0, 0, 0, 0);
            },
            message: 'Report date cannot be in the past'
        }
    },
    doctor: {
        type: String,
        required: [true, 'Doctor name or ID is required'],
        minlength: [3, 'Doctor must be at least 3 characters'],
        maxlength: [100, 'Doctor cannot exceed 100 characters'],
        trim: true,
        match: [/^[a-zA-Z0-9\s.'-]+$/, 'Doctor contains invalid characters']
    },
    patient: {
        type: String,
        required: [true, 'Patient name or ID is required'],
        minlength: [3, 'Patient must be at least 3 characters'],
        maxlength: [100, 'Patient cannot exceed 100 characters'],
        trim: true,
        match: [/^[a-zA-Z0-9\s.'-]+$/, 'Patient contains invalid characters']
    },
    status: {
        type: String,
        enum: {
            values: ['Completed', 'Cancelled', 'Upcoming'],
            message: 'Status must be Completed, Cancelled, or Upcoming'
        },
        required: [true, 'Status is required']
    },
    fees: {
        type: Number,
        required: [true, 'Fees are required'],
        min: [0, 'Fees cannot be negative'],
        max: [100000, 'Fees is unrealistically high']
    },
    reportNote: {
        type: String,
        maxlength: [1000, 'Report note cannot exceed 1000 characters'],
        trim: true
    },
    reportFile: {
        type: String,
        trim: true,
        match: [/^[\w,\s-]+\.(pdf|jpg|jpeg|png)$/i, 'Report file must be a valid PDF or image filename']
    }
}, { timestamps: true, versionKey: false });

// Index for efficient queries
reportSchema.index({ date: 1, doctor: 1, patient: 1 });

// Remove internal fields from API output
reportSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('Report', reportSchema);
