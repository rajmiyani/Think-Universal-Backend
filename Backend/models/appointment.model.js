import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Appointment date is required'],
    validate: {
      validator: function (v) {
        return v >= new Date().setHours(0, 0, 0, 0);
      },
      message: 'Appointment date cannot be in the past'
    }
  },
  time: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (use HH:MM)']
  },
  age: {
    type: Number,
    required: [true, 'Patient age is required'],
    min: [0, 'Age cannot be negative'],
    max: [120, 'Age cannot exceed 120']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor reference is required'],
    validate: {
      validator: function (v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Invalid doctor ID format'
    }
  },
  meetingMode: {
    type: String,
    enum: {
      values: ['Online', 'Offline'],
      message: 'Invalid meeting mode. Choose Online or Offline'
    },
    required: [true, 'Meeting mode is required']
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ['Cash', 'Card', 'UPI'],
      message: 'Invalid payment method. Choose Cash, Card, or UPI'
    },
    required: [true, 'Payment method is required']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true, versionKey: false }
});

// Indexes for faster querying
appointmentSchema.index({ date: 1, doctor: 1 });

export default mongoose.model('Appointment', appointmentSchema);
