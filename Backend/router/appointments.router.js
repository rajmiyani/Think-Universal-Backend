import express from 'express';
import {
  getAppointments,
  // getAppointmentsByDoctor,
  // createAppointment,
  // updateAppointment,
  // deleteAppointment,
  exportCSV,
} from '../controllers/appointment.controller.js';

import { verifyToken, authorizeRoles } from '../middleware/admin.middlware.js';

const router = express.Router();

router.get("/getAppointments", getAppointments); // For admin panel
// router.get("/doctor/:doctorId", verifyToken, authorizeRoles('doctor', 'admin'), getAppointmentsByDoctor);
// router.post('/createAppointment', verifyToken, authorizeRoles('patient', 'admin'), createAppointment);
// router.put('/updateAppointment/:id', verifyToken, authorizeRoles('admin', 'doctor'), updateAppointment);
// router.delete('/deleteAppointment/:id', verifyToken, authorizeRoles('admin'), deleteAppointment);
router.get("/export/csv", exportCSV);

export default router;