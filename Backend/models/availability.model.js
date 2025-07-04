import mongoose from 'mongoose';
import { adminDB } from '../config/mongoose.js';

// HH:MM format
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
  startDate: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: function (v) {
        return v && v >= new Date(new Date().setHours(0, 0, 0, 0));
      },
      message: 'Date must be today or in the future'
    }
  },
  endDate: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: function (v) {
        return v && v >= new Date(new Date().setHours(0, 0, 0, 0));
      },
      message: 'Date must be today or in the future'
    }
  },

  // ✅ Add this field to support multiple time slots
  slots: [
    {
      fromTime: {
        type: String,
        required: true,
        validate: {
          validator: (v) => timeRegex.test(v),
          message: 'Invalid fromTime format'
        }
      },
      toTime: {
        type: String,
        required: true,
        validate: {
          validator: function (v) {
            return (
              timeRegex.test(v) &&
              v > this.fromTime // compares string "HH:mm"
            );
          },
          message: 'toTime must be after fromTime'
        }
      }
    }
  ],


  // isMonthly: {
  //   type: Boolean,
  //   default: false
  // },

  modes: {
    audio: { type: Boolean, default: false },
    chat: { type: Boolean, default: false },
    videoCall: { type: Boolean, default: false }
  }
}, { timestamps: true });

export default adminDB.model('Availability', availabilitySchema);
