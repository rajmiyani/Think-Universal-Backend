import express from 'express';
import {
    saveReport,
    getReports,
    uploadCSV,
    exportCSV,
} from '../controllers/report.controller.js';
import { reportFilterSchema } from '../validations/validationSchema.js';
import validate from '../utils/validate.js';
import upload, { multerErrorHandler } from '../multer.js';
import { verifyToken } from '../middleware/admin.middlware.js';

const router = express.Router();

// Save report file (pdf, png, jpg)
router.post('/uploadreports', upload.single('reportFile'), saveReport, multerErrorHandler);

// Get filtered/paginated reports
router.get('/getReports', getReports);

// Upload CSV of patients (uses same upload middleware, different field name)
router.post('/upload-csv', upload.single('csvFile'), uploadCSV, multerErrorHandler);

// Export to CSV route if implemented
router.get('/export-csv', exportCSV); // Add this controller if needed

export default router;
