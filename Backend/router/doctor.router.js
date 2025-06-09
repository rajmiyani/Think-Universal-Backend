import express from 'express';
import upload from '../multer.js';
import {
  addDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  addBankDetails,
} from '../controllers/doctor.controller.js';
import { verifyToken, authorizeRoles } from '../middleware/admin.middlware.js';

const router = express.Router();

router.post('/addDoctor', upload.single('img'), verifyToken, authorizeRoles('admin'), addDoctor);

// router.get('/allDoctors', verifyToken, authorizeRoles('admin', 'doctor'), getAllDoctors);
// router.get('/:id', verifyToken, authorizeRoles('admin', 'doctor'), getDoctorById);
// router.put('/:id', verifyToken, authorizeRoles('admin', 'doctor'), updateDoctor);
// router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteDoctor);
// router.post('/:id/bank', verifyToken, authorizeRoles('doctor'), addBankDetails);

export default router;