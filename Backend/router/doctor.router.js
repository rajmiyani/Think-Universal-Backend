import express from 'express';
import upload from '../multer.js';
import {
  addDoctor,
} from '../controllers/doctor.controller.js';
import { verifyToken, authorizeRoles } from '../middleware/admin.middlware.js';

const router = express.Router();

router.post('/addDoctor', upload.single('img'), verifyToken, authorizeRoles('admin'), addDoctor);


export default router;