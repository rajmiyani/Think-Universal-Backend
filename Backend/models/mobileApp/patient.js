import mongoose from 'mongoose';
import { mobileDB, adminDB } from '../../config/mongoose.js'; // ✅ Import both DBs

const patientSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, trim: true },
  phone_number: { type: Number },
  gender: { type: String },
  dob: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  zipcode: { type: Number },
}, { timestamps: true });

// ✅ Register in both DBs
mobileDB.model('Users', patientSchema); // This connects to mobile data
adminDB.model('Users', patientSchema);  // ✅ This fixes the populate error in appointment queries

// Only export from one DB if needed
export default mobileDB.model('Users');
