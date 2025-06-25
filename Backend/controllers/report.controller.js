import Report from '../models/report.model.js';
import { reportFilterSchema } from '../validations/validationSchema.js'; // Joi schema for filters
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';


export const getAllReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate({ path: 'doctorId', select: 'firstName lastName email' })
            .populate({ path: 'userId', select: 'firstName lastName mobile email' })
            .populate({ path: 'appointmentId', select: 'date' })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: reports,
            message: "All reports fetched successfully."
        });
    } catch (err) {
        console.error('Admin Fetch Reports Error:', err);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
};

export const getReportByMobile = async (req, res) => {
    try {
        const mobile = req.params.mobile;

        if (!mobile || !/^\d{10}$/.test(mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing mobile number'
            });
        }

        const reports = await Report.find({ mobile }).sort({ date: -1 });

        if (!reports.length) {
            return res.status(404).json({
                success: false,
                message: 'No reports found for this mobile number'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Reports fetched successfully',
            data: reports
        });

    } catch (err) {
        console.error("❌ Error in getReportByMobile:", err);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

export const updateReports = async (req, res) => {
    try {
        const { reportId, symptoms, allergies, currentMedications, diagnosis, treatmentPlan } = req.body;
        const file = req.files?.attachments ? req.files.attachments[0] : null;

        if (!reportId || !symptoms || !diagnosis) {
            return res.status(400).json({ success: false, message: 'Required fields missing.' });
        }

        const existingReport = await Report.findById(reportId);
        if (!existingReport) {
            return res.status(404).json({ success: false, message: "Report not found." });
        }

        let fullFileName = existingReport.attachments;
        if (file) {
            // ⬇️ Copy your AWS S3 logic here from existing code
            // Upload to S3, validate mimetype, get `fullFileName` URL...
        }

        const updated = await Report.findByIdAndUpdate(reportId, {
            symptoms,
            allergies,
            currentMedications: JSON.parse(currentMedications),
            diagnosis,
            treatmentPlan,
            attachments: fullFileName
        }, { new: true });

        return res.status(200).json({
            success: true,
            data: updated,
            message: "Report updated by Admin successfully."
        });
    } catch (err) {
        console.error("Admin Update Report Error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
};

// GET /reports/export (with validation and security)
export const exportCSV = async (req, res) => {
    try {
        const { error, value } = reportFilterSchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

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
        console.error("❌ CSV Export Error:", err);
        return res.status(500).json({ success: false, message: 'CSV export failed', error: err.message });
    }
};

// PATCH /reports/:id/upload (with validation and file checks)
export const uploadReport = async (req, res) => {
    try {
        const { error, value } = reportUploadSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(e => e.message);
            return res.status(400).json({ success: false, errors });
        }

        const { id } = req.params;
        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        // Handle file upload validation
        if (req.file) {
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
            const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
            const ext = path.extname(req.file.originalname).toLowerCase();

            if (!allowedTypes.includes(req.file.mimetype) || !allowedExtensions.includes(ext)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file type. Only PDF, JPG, and PNG allowed.'
                });
            }

            if (req.file.size > 5 * 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    message: 'File size exceeds 5MB limit.'
                });
            }

            report.reportFile = `/uploads/${req.file.filename}`;
        }

        if (value.reportNote) {
            report.reportNote = value.reportNote.trim();
        }

        await report.save();

        res.json({ success: true, message: 'Report updated successfully', data: report });
    } catch (err) {
        console.error("❌ Upload Error:", err);
        return res.status(500).json({ success: false, message: 'Upload error', error: err.message });
    }
};
