import express from 'express';
import { addPrescription, getAllPrescriptions, getPrescriptions } from '../controllers/prescription.controller.js';
import authMiddleware from '../middleware/prescription.middleware.js';

const router = express.Router();

// POST: Add a prescription
router.post('/addPrescription/:reportId', authMiddleware, addPrescription);

// GET: Get all prescriptions for a report
router.get('/getPrescription/:reportId', authMiddleware, getPrescriptions);

// Get all prescriptions (for admin)
router.get('/getAllPrescriptions', getAllPrescriptions);

export default router;