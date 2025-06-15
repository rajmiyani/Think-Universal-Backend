import mongoose from 'mongoose';

const dashboardSchema = new mongoose.Schema({
    doctorName: {
        type: String,
        required: [true, 'Doctor name is required'],
        minlength: [3, 'Doctor name must be at least 3 characters'],
        maxlength: [100, 'Doctor name cannot exceed 100 characters'],
        trim: true,
        match: [/^[a-zA-Z0-9\s.'-]+$/, 'Doctor name contains invalid characters']
    },
    patientName: {
        type: String,
        required: [true, 'Patient name is required'],
        minlength: [3, 'Patient name must be at least 3 characters'],
        maxlength: [100, 'Patient name cannot exceed 100 characters'],
        trim: true,
        match: [/^[a-zA-Z0-9\s.'-]+$/, 'Patient name contains invalid characters']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        validate: {
            validator: function (v) {
                return v && v <= new Date();
            },
            message: 'Date cannot be in the future'
        }
    },
    status: {
        type: String,
        enum: {
            values: ['Completed', 'Upcoming', 'Cancelled'],
            message: 'Status must be Completed, Upcoming, or Cancelled'
        },
        required: [true, 'Status is required']
    },
    revenue: {
        type: Number,
        min: [0, 'Revenue cannot be negative'],
        max: [1000000, 'Revenue is unrealistically high'],
        default: 0
    }
}, { timestamps: true, versionKey: false });

// Index for fast analytics queries
dashboardSchema.index({ date: 1, doctorName: 1, status: 1 });

// Sanitize output
dashboardSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('Dashboard', dashboardSchema);