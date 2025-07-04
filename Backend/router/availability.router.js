// router/availability.router.js
import express from 'express';
import {
  setAvailability,
  getAvailabilityDoctor,
} from '../controllers/availability.controller.js';
import { verifyToken } from '../middleware/admin.middlware.js';
import { verifyTokenAvailability } from '../middleware/availability.middleware.js';

const router = express.Router();

// Only authenticated doctors can set their availability
router.post('/setAvailability', verifyTokenAvailability, setAvailability);

// router.get('/:doctorId', verifyToken, authorizeRoles('doctor', 'admin'), getAvailabilityDoctor);
router.get('/allAvailability',  getAvailabilityDoctor);

export default router;