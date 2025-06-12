// router/patient.router.js
import express from 'express';
import {
  syncPatient,
  getAllPatients,
} from '../controllers/patient.controller.js';
import { verifyToken, authorizeRoles } from '../middleware/admin.middlware.js';

const router = express.Router();

router.post('/syncPatient', syncPatient);
router.get('/all', verifyToken, authorizeRoles('doctor', 'admin'), getAllPatients); // For admin frontend

export default router;
