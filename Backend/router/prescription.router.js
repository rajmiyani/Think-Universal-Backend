import express from 'express';
import { addPrescription, getPrescriptions, updatePrescription } from '../controllers/prescription.controller.js';
import authMiddleware from '../middleware/prescription.middleware.js';

const router = express.Router();

// ✅ Add a prescription
router.post('/addPrescription/:phoneNo', authMiddleware, addPrescription);

// ✅ Get the latest prescription for a patient
router.get('/getPrescriptions', authMiddleware, getPrescriptions);

// ✅ Update the latest prescription for a patient
router.put('/prescriptionsUpdate/:phoneNo', authMiddleware, updatePrescription);

export default router;