import express from 'express';
import {
  getAppointments,
  getAppointmentsByDoctor,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  exportCSV,
  // getAppointmentById,
  // updateAppointmentStatus
} from '../controllers/appointment.controller.js';

import { verifyToken, authorizeRoles } from '../middleware/admin.middlware.js';

const router = express.Router();

// Routes
router.get("/getAppointments", getAppointments);
router.get("/doctor/:doctorId", verifyToken, authorizeRoles('doctor', 'admin'), getAppointmentsByDoctor);
router.post('/createAppointment', verifyToken, authorizeRoles('patient', 'admin'), createAppointment);
router.put('/updateAppointment/:id', verifyToken, authorizeRoles('admin', 'doctor'), updateAppointment);
router.delete('/deleteAppointment/:id', verifyToken, authorizeRoles('admin'), deleteAppointment);
router.get("/export/csv", exportCSV);

// Add these if they exist in controller
// router.get("/getAppointmentById/:id", getAppointmentById);
// router.put("/status/:id", updateAppointmentStatus);

export default router;
