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
  upload.single('avatar'), // ✅ match with req.file field
  verifyToken,
  authorizeRoles('admin'),
  addDoctor
);

router.get('/allDoctor', allDoctor);

// ✅ Update doctor profile (auth middleware required)
router.put(
  '/updateProfile',
  verifyToken,             // protect route
  upload.single('avatar'), // ✅ match controller
  updateDoctorProfile
);

export default router;
