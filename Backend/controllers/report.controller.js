import Report from '../models/report.model.js';
import { reportFilterSchema } from '../validations/validationSchema.js'; // Joi schema for filters
import { reportUploadSchema } from '../validations/validationSchema.js'; // Joi schema for upload/update
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';

// GET /reports (with validation)
export const getReports = async (req, res) => {
    try {
        console.log("🔍 Incoming Query:", req.query);

        const { error, value } = reportFilterSchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            console.error("❌ Validation Error:", error.details);
            const errors = error.details.map(e => e.message);
            return res.status(400).json({ success: false, errors });
        }

        console.log("✅ Validated Query:", value);

        const { doctor, status, startDate, endDate, page, limit } = value;

        const query = {};
        if (doctor) query.doctor = doctor;
        if (status) query.status = status;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;
        const total = await Report.countDocuments(query);
        const reports = await Report.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            data: reports,
            pagination: { total, page, pages: Math.ceil(total / limit) }
        });
    } catch (err) {
        console.error("🔥 Controller Error:", err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};


// GET /reports/export (with validation and security)
export const exportCSV = async (req, res) => {
    try {
        // Validate filters if used
        const { error, value } = reportFilterSchema.validate(req.query, { abortEarly: false, stripUnknown: true });
        if (error) {
            const errors = error.details.map(e => e.message);
            return res.status(400).json({ success: false, errors });
        }
        const { doctor, status, startDate, endDate } = value;

        const query = {};
        if (doctor) query.doctor = doctor;
        if (status) query.status = status;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Security: Limit CSV export to 1000 records max
        const reports = await Report.find(query).limit(1000);

        if (!reports.length) {
            return res.status(404).json({ success: false, message: 'No reports found for export.' });
        }

        const fields = ['date', 'doctor', 'patient', 'status', 'fees', 'reportNote'];
        const parser = new Parser({ fields });
        const csv = parser.parse(reports);

        res.header('Content-Type', 'text/csv');
        res.attachment('report-export.csv');
        return res.send(csv);
    } catch (err) {
        res.status(500).json({ success: false, message: 'CSV export failed', error: err.message });
    }
};

// PATCH /reports/:id/upload (with validation and file checks)
export const uploadReport = async (req, res) => {
    try {
        // Validate body (for reportNote) and file (if present)
        const { error, value } = reportUploadSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            const errors = error.details.map(e => e.message);
            return res.status(400).json({ success: false, errors });
        }

        const { id } = req.params;
        const report = await Report.findById(id);
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        // File validation
        if (req.file) {
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
            const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
            const ext = path.extname(req.file.originalname).toLowerCase();

            if (!allowedTypes.includes(req.file.mimetype) || !allowedExtensions.includes(ext)) {
                return res.status(400).json({ success: false, message: 'Invalid file type. Only PDF, JPG, and PNG allowed.' });
            }
            if (req.file.size > 5 * 1024 * 1024) {
                return res.status(400).json({ success: false, message: 'File size exceeds 5MB limit.' });
            }
            report.reportFile = `/uploads/${req.file.filename}`;
        }

        // Update reportNote if provided
        if (typeof value.reportNote === 'string') {
            report.reportNote = value.reportNote.trim();
        }

        await report.save();

        res.json({ success: true, message: 'Report updated', data: report });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Upload error', error: err.message });
    }
};
