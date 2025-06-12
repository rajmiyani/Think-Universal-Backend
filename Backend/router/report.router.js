// router/patient.router.js
import express from 'express';
import {
    // addReport,
    getReports,
    uploadReport,
    exportCSV
} from '../controllers/report.controller.js';
import { reportFilterSchema } from '../validations/validationSchema.js';
import validate from '../utils/validate.js';
import upload from '../multer.js';

const router = express.Router();

// GET Reports with filters
router.get('/getReports', validate(reportFilterSchema, 'query'), getReports);

// GET Export CSV
router.get('/export', validate(reportFilterSchema, 'query'), exportCSV);

// PUT Upload report file + note
router.put('/upload/:id', upload.single('reportFile'), uploadReport);


export default router;