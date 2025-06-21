import express from 'express';
import upload from '../multer.js';
import {
  addDoctor,
  allDoctor,
  updateDoctorProfile
} from '../controllers/doctor.controller.js';
import { verifyToken, authorizeRoles } from '../middleware/admin.middlware.js';

const router = express.Router();

router.post('/addDoctor', upload.single('img'), verifyToken, authorizeRoles('admin'), addDoctor);
router.get('/allDoctor',allDoctor);
router.put('/update-profile', upload.single('img'), updateDoctorProfile);


export default router;
