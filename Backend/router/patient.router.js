// router/patient.router.js
import express from 'express';
import {
  getAllPatients,
  getPatientById,
} from '../controllers/patient.controller.js';
import { verifyToken, authorizeRoles } from '../middleware/admin.middlware.js';

const router = express.Router();

// Only authenticated doctors or admins can view all patients
router.get('/all', verifyToken, authorizeRoles('doctor', 'admin'), getAllPatients);

// Only authenticated doctors, admins, or the patient themselves can view patient by ID
// For simplicity, we allow doctors and admins here. For patient self-access, add logic in the controller.
router.get('/:id', verifyToken, authorizeRoles('doctor', 'admin'), getPatientById);

export default router;
