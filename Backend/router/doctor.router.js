import express from 'express';
import multer from 'multer';
import {
  addDoctor,
  allDoctor,
  updateDoctorProfile
} from '../controllers/doctor.controller.js';
import { verifyToken, authorizeRoles } from '../middleware/admin.middlware.js';

const router = express.Router();

// ✅ Setup multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Routes
router.post(
  '/addDoctor',
  upload.single('avatar'),
  verifyToken,
  authorizeRoles('admin'),
  addDoctor
);

router.get('/allDoctor', allDoctor);

router.put(
  '/updateProfile',
  upload.single('avatar'),
  updateDoctorProfile
);

export default router;
