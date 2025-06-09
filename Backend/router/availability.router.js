// router/availability.router.js
import express from 'express';
import {
  setAvailability,
  getAvailabilityDoctor,
} from '../controllers/availability.controller.js';
import { verifyToken, authorizeRoles } from '../middleware/admin.middlware.js';
import { verifyTokenAvailability } from '../middleware/availability.middleware.js';

const router = express.Router();

// Only authenticated doctors can set their availability
router.post('/setAvailability', verifyTokenAvailability, setAvailability);

// Only authenticated doctors or admins can view availability
// router.get('/:doctorId', verifyToken, authorizeRoles('doctor', 'admin'), getAvailabilityDoctor);
router.get('/allAvailability', verifyToken, authorizeRoles('doctor', 'admin'), getAvailabilityDoctor);

export default router;