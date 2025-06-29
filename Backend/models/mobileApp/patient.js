import mongoose from 'mongoose';
import { mobileDB } from '../../config/mongoose.js';

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
}, {
  timestamps: true,
});

export default mobileDB.model('User', patientSchema); // 'User' is correct because that's the model name in mobile DB
