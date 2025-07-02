import mongoose from "mongoose";
import Report from "../models/report.model.js";
import '../models/user.model.js';    // 👈 Ensures User model is registered
import '../models/doctor.model.js';

// Create or update report
export const saveReport = async (req, res) => {
    try {
        const { doctorId, userId, appointmentId, date, status, fees, doctorNote, phoneNo, prescriptionNote  } = req.body;

        const file = req.file ? req.file.filename : null;

        const report = await Report.findOneAndUpdate(
            { appointmentId },
            {
                doctorId,
                userId,
                appointmentId,
                date,
                status,
                fees,
                doctorNote,
                phoneNo,
                prescriptionNote,
                ...(file && { reportFile: file }),
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true, message: "Report saved successfully", data: report });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error saving report", error: err.message });
    }
};

// Get paginated reports with filters
export const getReports = async (req, res) => {
    try {
        const { page = 1, limit = 10, doctorId, status, startDate, endDate } = req.query;

        const filter = {};

        // ✅ Validate doctorId if provided
        if (doctorId) {
            if (!mongoose.Types.ObjectId.isValid(doctorId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid doctorId format'
                });
            }
            filter.doctorId = doctorId;
        }

        // ✅ Status filter (ignore "All")
        if (status && status !== "All") {
            filter.status = status;
        }

        // ✅ Date filter
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        } else {
            // Default to current month
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            filter.date = {
                $gte: firstDay,
                $lte: lastDay,
            };
        }

        // ✅ Fetch reports with pagination
        const reports = await Report.find(filter)
            .populate("doctorId", "firstName lastName")
            .populate("userId", "firstName lastName")
            .sort({ date: -1 })
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await Report.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: reports,
            pagination: {
                total,
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
            },
        });

    } catch (err) {
        console.error('❌ getReports Error:', err);
        return res.status(500).json({
            success: false,
            message: "Error fetching reports",
            error: err.message
        });
    }
};

export const uploadCSV = async (req, res) => {
    try {
        const doctorId = req.body.doctorId;
        const filePath = req.file.path;

        if (!doctorId || !filePath) {
            return res.status(400).json({ success: false, message: "Missing doctorId or CSV file" });
        }

        const db = getDoctorDB(doctorId);
        const Patient = db.model("Patient");

        const results = [];

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on("data", (data) => results.push(data))
            .on("end", async () => {
                const inserted = await Patient.insertMany(results);
                res.status(200).json({
                    success: true,
                    message: "CSV uploaded successfully",
                    data: inserted,
                });
            });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error uploading CSV", error: err.message });
    }
};

export const exportCSV = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate("doctorId", "firstName lastName")
            .populate("userId", "firstName lastName")
            .populate("appointmentId", "date");

        if (!reports.length) {
            return res.status(404).json({ success: false, message: "No reports to export." });
        }

        const formattedData = reports.map((r) => ({
            Date: r.appointmentId?.date?.toISOString().split('T')[0] || '',
            Doctor: `${r.doctorId?.firstName || ''} ${r.doctorId?.lastName || ''}`,
            Patient: `${r.userId?.firstName || ''} ${r.userId?.lastName || ''}`,
            Status: r.status || '',
            Fees: r.fees || 0,
            DoctorNote: r.doctorNote || '',
            ReportFile: r.reportFile || '',
        }));

        const parser = new Parser();
        const csv = parser.parse(formattedData);

        res.header("Content-Type", "text/csv");
        res.attachment("appointment-reports.csv");
        res.status(200).send(csv);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to export CSV",
            error: err.message
        });
    }
};