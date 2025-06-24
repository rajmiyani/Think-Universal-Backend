import express from 'express';
import {
    getReports,
    uploadReport,
    exportCSV,
    createReport
} from '../controllers/report.controller.js';
import { reportFilterSchema } from '../validations/validationSchema.js';
import validate from '../utils/validate.js';
import upload from '../multer.js';
import { verifyToken } from '../middleware/admin.middlware.js';

const router = express.Router();

router.post('/createReport', verifyToken, createReport)

// GET /reports/getReports
router.get('/getReports', validate(reportFilterSchema, 'query'), getReports);
// router.get('/getReports', getReports);


// GET /reports/export
router.get('/export', validate(reportFilterSchema, 'query'), exportCSV);

// PUT /reports/upload/:id
router.put('/upload/:id', upload.single('reportFile'), uploadReport);

export default router;