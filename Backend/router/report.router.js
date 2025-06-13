import express from 'express';
import {
    getReports,
    uploadReport,
    exportCSV
} from '../controllers/report.controller.js';
import { reportFilterSchema } from '../validations/validationSchema.js';
import validate from '../utils/validate.js';
import upload from '../multer.js';

const router = express.Router();

// GET /reports/getReports
router.get('/getReports', validate(reportFilterSchema, 'query'), getReports);
// router.get('/getReports', getReports);


// GET /reports/export
router.get('/export', validate(reportFilterSchema, 'query'), exportCSV);

// PUT /reports/upload/:id
router.put('/upload/:id', upload.single('reportFile'), uploadReport);

export default router;
