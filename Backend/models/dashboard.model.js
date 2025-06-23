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
    },
    duration: {
        type: Number, // in minutes
        required: [true, 'Duration is required'],
        min: [5, 'Appointment must be at least 5 minutes'],
        max: [240, 'Appointment cannot exceed 4 hours']
    },
    appointmentType: {
        type: String,
        enum: {
            values: ['Check-up', 'Follow-up', 'Consultation', 'Urgent'],
            message: 'Appointment type must be Check-up, Follow-up, Consultation, or Urgent'
        },
        required: [true, 'Appointment type is required']
    },
}, {
    timestamps: true,
    versionKey: false,
    toJSON: {
        transform: function (doc, ret) {
            // Convert date to ISO string for consistent output
            ret.date = doc.date.toISOString();
            // Remove internal fields
            delete ret.createdAt;
            delete ret.updatedAt;
            return ret;
        }
    },
    toObject: {
        transform: function (doc, ret) {
            ret.date = doc.date.toISOString();
            delete ret.createdAt;
            delete ret.updatedAt;
            return ret;
        }
    }
});

// Indexes for fast analytics queries
dashboardSchema.index({ date: 1 }); // For time-based queries
dashboardSchema.index({ doctorName: 1 }); // For doctor-specific reports
dashboardSchema.index({ status: 1 }); // For status-based filtering
dashboardSchema.index({ appointmentType: 1 }); // For type-based analytics

// Virtual for formatted date (optional)
dashboardSchema.virtual('formattedDate').get(function () {
    return this.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
});

export default mongoose.model('Dashboard', dashboardSchema);