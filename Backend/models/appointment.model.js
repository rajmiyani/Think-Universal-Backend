import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor reference is required']
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient reference is required']
  },
  date: {
    type: String,
    required: [true, 'Appointment date is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
  },
  time: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^\d{2}:\d{2}$/, 'Time must be in HH:mm format']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'completed', 'cancelled'],
      message: 'Status must be pending, approved, completed, or cancelled'
    },
    default: 'pending'
  },
  prescription: {
    type: String,
    trim: true,
    maxlength: [3000, 'Prescription must be at most 3000 characters']
  }
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);
