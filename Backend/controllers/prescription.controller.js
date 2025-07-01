import Prescription from '../models/prescription.model.js';
import Report from '../models/report.model.js';
import mongoose from 'mongoose';
import { getPrescriptionsParamSchema, prescriptionSchema } from '../validations/validationSchema.js'

// Add prescription to report (reportId from URL param, createdBy from user)
export const addPrescription = async (req, res) => {
    try {
        const { reportId, prescriptionNote, patientMobile } = req.body;

        if (!prescriptionNote) {
            return res.status(400).json({
                success: false,
                message: "prescriptionNote is required"
            });
        }

        let mobile = '';
        let finalReportId = reportId;

        if (reportId) {
            const report = await Report.findById(reportId); // No need to populate userId now

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'Report not found'
                });
            }

            console.log("📋 Fetched Report:", report);

            // ✅ Use phoneNo directly from report
            if (report.phoneNo) {
                mobile = report.phoneNo.trim();
            } else if (patientMobile) {
                console.warn("⚠️ report.phoneNo missing, falling back to patientMobile from request body");
                mobile = patientMobile.trim();
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Patient contact number is missing in the report and not provided manually'
                });
            }

        } else {
            if (!patientMobile) {
                return res.status(400).json({
                    success: false,
                    message: "Either reportId or patientMobile is required"
                });
            }

            mobile = patientMobile.trim();
            finalReportId = null;
        }

        // Ensure createdBy is valid
        const createdBy = req.user?.name && req.user.name.length >= 3
            ? req.user.name
            : (req.body.createdBy?.trim() || 'Unknown');

        const newPrescription = new Prescription({
            patientMobile: mobile,
            prescriptionNote,
            createdBy,
            reportId: finalReportId
        });

        await newPrescription.save();

        return res.status(201).json({
            success: true,
            message: 'Prescription added successfully',
            data: newPrescription
        });

    } catch (err) {
        console.error('❌ Error adding prescription:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to add prescription',
            error: err.message
        });
    }
};

// Get prescriptions for a specific report (reportId from URL param)
export const getPrescriptions = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", doctorId } = req.query;

        const filter = {};

        // ✅ Filter by doctorId through related reports
        if (doctorId) {
            if (!mongoose.Types.ObjectId.isValid(doctorId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid doctorId format'
                });
            }

            const reportIds = await Report.find({ doctorId }).distinct('_id');
            filter.reportId = { $in: reportIds };
        }

        // ✅ Search by phone number or prescription note
        if (search) {
            filter.$or = [
                { patientMobile: { $regex: search, $options: "i" } },
                { prescriptionNote: { $regex: search, $options: "i" } }
            ];
        }

        // ✅ Fetch prescriptions and populate doctor/patient data
        const prescriptions = await Prescription.find(filter)
            .populate({
                path: 'reportId',
                populate: [
                    { path: 'userId', select: 'firstName lastName' },
                    { path: 'doctorId', select: 'firstName lastName' }
                ]
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await Prescription.countDocuments(filter);

        const formatted = prescriptions.map((p, index) => ({
            no: index + 1 + (page - 1) * limit,
            patientName: `${p.reportId?.userId?.firstName || ''} ${p.reportId?.userId?.lastName || ''}`,
            doctorName: `${p.reportId?.doctorId?.firstName || ''} ${p.reportId?.doctorId?.lastName || ''}`,
            phoneNo: p.patientMobile,
            date: p.createdAt,
            prescription: p.prescriptionNote
        }));

        return res.status(200).json({
            success: true,
            data: formatted,
            pagination: {
                total,
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
            }
        });

    } catch (err) {
        console.error('❌ Error fetching prescriptions:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch prescriptions',
            error: err.message
        });
    }
};


export const updatePrescription = async (req, res) => {
    try {
        console.log("🔥 Received req.body:", req.body);

        const { phoneNo } = req.params;
        const { prescriptionNote, reportId } = req.body;

        if (!phoneNo) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        if (!prescriptionNote || prescriptionNote.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Prescription note must be at least 2 characters'
            });
        }

        const trimmedPhone = phoneNo.trim();
        const createdBy = req.user?.name || req.body?.createdBy || 'Unknown';

        const latest = await Prescription.findOne({
            patientMobile: trimmedPhone,
            createdBy
        }).sort({ createdAt: -1 });

        if (!latest) {
            return res.status(404).json({
                success: false,
                message: 'No prescription found for this patient and doctor'
            });
        }

        latest.prescriptionNote = prescriptionNote.trim();
        latest.updatedAt = new Date();

        // ✅ If reportId is passed, update it too
        if (reportId && mongoose.Types.ObjectId.isValid(reportId)) {
            latest.reportId = reportId;
        }

        await latest.save();

        return res.status(200).json({
            success: true,
            message: 'Prescription updated successfully',
            data: latest
        });

    } catch (err) {
        console.error("🔥 Error in updatePrescription:", err);
        return res.status(500).json({
            success: false,
            message: 'Failed to update prescription',
            error: err.message
        });
    }
};


