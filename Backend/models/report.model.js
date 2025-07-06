import mongoose from "mongoose";
import { adminDB } from '../config/mongoose.js';

const reportSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
  phoneNo: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["Completed", "Cancelled", "Upcoming"], required: true },
  fees: { type: Number, default: 0 },
  reportFile: { type: String },
  doctorNote: { type: String },
  prescriptionNote: { type: String },
}, { timestamps: true });


const Report = adminDB.models.Report || adminDB.model('Report', reportSchema);

export default Report;