import express from 'express';
import { addPrescription, getPrescriptionsByDoctor, getPrescriptions, updatePrescription } from '../controllers/prescription.controller.js';
import authMiddleware from '../middleware/prescription.middleware.js';

const router = express.Router();

// POST: Add a prescription
router.post('/addPrescription/:phoneNo', authMiddleware, addPrescription);

// GET: Get all prescriptions for a report
router.get('/getPrescriptions/:phoneNo', authMiddleware, getPrescriptions);

// Get all prescriptions (for admin)
router.get('/getAllPrescriptions/:doctoName', getPrescriptionsByDoctor);

router.put('/prescriptionsUpdate/:phoneNo', authMiddleware, updatePrescription);


export default router;