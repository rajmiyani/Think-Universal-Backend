import Report from '../models/report.model.js';
import { createReportSchema, reportFilterSchema } from '../validations/validationSchema.js'; // Joi schema for filters
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';


export const createReport = async (req, res) => {
    try {
        const { error, value } = createReportSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map(e => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        const {
            firstName,
            lastName,
            age,
            gender,
            doctor,
            patient,
            date,
            fees,
            status,
            mobile,
            diagnosis,
            prescriptions
        } = value;

        const patientId = req.user?.id || req.user?._id;
        if (!patientId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: patientId not found from token'
            });
        }

        const reportData = {
            firstName,
            lastName,
            age,
            gender,
            doctor,
            patient,
            date,
            fees,
            status,
            mobile,
            diagnosis,
            prescriptions,
            patientId
        };

        const report = new Report(reportData);
        const savedReport = await report.save();

        res.status(201).json({
            success: true,
            message: "Report created successfully",
            data: savedReport
        });

    } catch (err) {
        console.error('❌ Error creating report:', err);

        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Duplicate entry detected. Please check your input.'
            });
        }

        res.status(500).json({
            success: false,
            message: "Error creating report",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};



// GET /reports (with validation)
export const getReports = async (req, res) => {
    try {
        const value = req.validatedQuery || req.query;

        const { doctor, status, startDate, endDate, page = 1, limit = 10 } = value;

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

        return res.json({
            success: true,
            data: reports,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
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
