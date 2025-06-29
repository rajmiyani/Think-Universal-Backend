import mongoose from 'mongoose';
import { adminDB } from '../config/mongoose.js';

const appointmentSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  date: String,
  timeSlot: mongoose.Schema.Types.ObjectId,
  modeId: mongoose.Schema.Types.ObjectId,
  price: Number,
  name: String,
  ageRange: String,
  contactNumber: String,
  gender: String,
  problem: String,
  paymentMode: String,
  paymentStatus: {
    type: String,
    enum: ['Done', 'Pending', 'Success']
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Completed', 'Cancel']
  },
  prescription: String,
  prescriptionDate: String,
  isOther: Boolean,
  reason: String,
  rescheduleReason: String,
  paymentLink: String,
  paymentId: String
}, { timestamps: true });

export default adminDB.model('Appointment', appointmentSchema);
