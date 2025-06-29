import mongoose from "mongoose";
import { mobileDB } from '../config/mongoose.js';

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",  // Corrected the typo from "Dcotor" to "Doctor"
      require: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      require: true
    },
    date: {
      type: String,
      require: true
    },
    timeSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorAvailability",
      require: true
    },
    modeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mode",
      require: true
    },
    price: {
      type: Number,
      require: true
    },
    name: {
      type: String,
      require: true
    },
    ageRange: {
      type: String,
      require: true
    },
    contactNumber: {
      type: String,
      require: true
    },
    gender: {
      type: String,
      require: true
    },
    problem: {
      type: String,
      require: true
    },
    paymentMode: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ['Done', 'Pending', 'Success']
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Completed', 'Cancel']
    },
    prescription: {
      type: String
    },
    prescriptionDate: {
      type: String
    },
    isOther: {
      type: Boolean
    },
    reason: {
      type: String
    },
    rescheduleReason: {
      type: String
    },
    paymentLink: {
      type: String,
      default: ""
    },
    paymentId: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
  }
);

// ✅ Use existing model if already registered
const Appointment = mobileDB.models.Appointment || mobileDB.model('Appointment', appointmentSchema);

export default Appointment;