import express from 'express';
import upload from '../multer.js';
import {
  addDoctor,
  allDoctor,
  updateDoctorProfile
} from '../controllers/doctor.controller.js';
import { verifyToken, authorizeRoles } from '../middleware/admin.middlware.js';

const router = express.Router();

// ✅ Setup multer memory storage

// ✅ Routes
router.post(
  '/addDoctor',
  upload.single('avatar'),
  // verifyToken,
  // authorizeRoles('main'),
  addDoctor
);

router.get('/allDoctor', allDoctor);

router.put(
  '/updateProfile/:id',
  // verifyToken,
  upload.single('avatar'),
  updateDoctorProfile
);


export default router;
