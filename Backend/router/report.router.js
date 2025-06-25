import express from 'express';
import {
    getAllReports,
    getReportByMobile,
    updateReports,
    uploadReport,
    exportCSV,
} from '../controllers/report.controller.js';
import { reportFilterSchema } from '../validations/validationSchema.js';
import validate from '../utils/validate.js';
import upload from '../multer.js';
import { verifyToken } from '../middleware/admin.middlware.js';

const router = express.Router();


router.get('/getAllReports', verifyToken, getAllReports);
router.patch('/updateReports/:id', verifyToken, updateReports);
router.get('/getReport/:mobile', verifyToken, getReportByMobile);


// GET /reports/export
router.get('/export', validate(reportFilterSchema, 'query'), exportCSV);

// PUT /reports/upload/:id
router.put('/upload/:id', upload.single('reportFile'), uploadReport);

export default router;