import mongoose from 'mongoose';

// Helper RegExp for HH:MM 24-hour format (e.g., "09:00", "18:30")
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const availabilitySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor ID is required'],
    validate: {
      validator: mongoose.Types.ObjectId.isValid,
      message: 'Invalid doctor ID format'
    }
  },
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
  date: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: function (v) {
        // Date must not be in the past
        return v && v >= new Date(new Date().setHours(0, 0, 0, 0));
      },
      message: 'Date must be today or in the future'
    }
  },
  fromTime: {
    type: String,
    required: [true, 'From time is required'],
    validate: {
      validator: function (v) {
        return timeRegex.test(v);
      },
      message: 'From time must be in HH:MM 24-hour format'
    }
  },
  toTime: {
    type: String,
    required: [true, 'To time is required'],
    validate: [
      {
        validator: function (v) {
          return timeRegex.test(v);
        },
        message: 'To time must be in HH:MM 24-hour format'
      },
      {
        validator: function (v) {
          // Ensure toTime is after fromTime
          if (!this.fromTime || !timeRegex.test(v) || !timeRegex.test(this.fromTime)) return true;
          const [fromH, fromM] = this.fromTime.split(':').map(Number);
          const [toH, toM] = v.split(':').map(Number);
          return toH > fromH || (toH === fromH && toM > fromM);
        },
        message: 'To time must be after from time'
      }
    ]
  },
  isMonthly: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('Availability', availabilitySchema);