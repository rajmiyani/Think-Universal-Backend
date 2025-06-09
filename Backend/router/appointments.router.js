// router/appointment.router.js
import express from 'express';
import {
  createAppointment,
  getAppointmentsByDoctor,
  updateAppointmentStatus,
  addPrescription,
} from '../controllers/appointment.controller.js';
import { verifyToken, authorizeRoles } from '../middleware/admin.middlware.js';

const router = express.Router();

// Patients and admins can create appointments
router.post('/create', verifyToken, authorizeRoles('patient', 'admin'), createAppointment);

// Doctors and admins can view appointments for a doctor
router.get('/doctor/:doctorId', verifyToken, authorizeRoles('doctor', 'admin'), getAppointmentsByDoctor);

// Doctors and admins can update appointment status
router.put('/status/:id', verifyToken, authorizeRoles('doctor', 'admin'), updateAppointmentStatus);

// Doctors can add prescription to an appointment
router.post('/prescription/:id', verifyToken, authorizeRoles('doctor'), addPrescription);

export default router;
