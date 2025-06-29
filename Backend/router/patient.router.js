// router/patient.router.js
import express from 'express';
import {
  getAllPatients,
} from '../controllers/patient.controller.js';
import { verifyToken, authorizeRoles } from '../middleware/admin.middlware.js';

const router = express.Router();

router.get('/sync', verifyToken, getAllPatients); // For admin frontend

export default router;
