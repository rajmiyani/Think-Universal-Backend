import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { adminDB } from '../config/mongoose.js';

const patientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    default: ''
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    match: [/.+@.+\..+/, 'Invalid email format']
  },
  phone: {
    type: String,
    trim: true,
    required: [true, 'Phone number is required'],
    match: [/^\+?\d{10,15}$/, 'Phone number must be 10 to 15 digits with optional +'],
  },
  contactNumber: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  token: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'user'
  },
  isOtpVerification: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Other'
  },
  age: {
    type: Number,
    default: 30
  },
  address: {
    type: String,
    trim: true,
    default: 'N/A'
  }
}, { timestamps: true });

patientSchema.plugin(mongoosePaginate); 

export default adminDB.model('Patient', patientSchema);
