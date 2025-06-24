import Prescription from '../models/prescription.model.js';
import Report from '../models/report.model.js';
import { getPrescriptionsParamSchema, prescriptionSchema, getAllPrescriptionsQuerySchema } from '../validations/validationSchema.js'

// Add prescription to report (reportId from URL param, createdBy from user)
export const addPrescription = async (req, res) => {
    try {
        console.log("📥 API Hit: /addPrescription/:phoneNo");

        // ✅ Validate request body
        const { error, value } = prescriptionSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            console.log("❌ Validation error:", error.details.map(e => e.message));
            return res.status(400).json({
                success: false,
                errors: error.details.map(e => e.message)
            });
        }

        const { prescriptionNote, createdBy: inputCreatedBy } = value;
        const mobile = req.params.phoneNo?.trim();

        if (!mobile) {
            return res.status(400).json({
                success: false,
                message: 'Patient mobile number is required in the URL.'
            });
        }

        console.log("📱 Mobile received:", mobile);
        console.log("📝 Prescription Note:", prescriptionNote);

        // 🧠 Use createdBy from user or request body
        const createdBy = req.user?.name || inputCreatedBy || 'Unknown';
        console.log("👨‍⚕️ Created By:", createdBy);

        // ✅ Ensure report exists for the given mobile
        const reportExists = await Report.exists({ mobile });
        if (!reportExists) {
            console.log("❌ No report found for the provided mobile number.");
            return res.status(404).json({
                success: false,
                message: 'No report found for the provided mobile number.'
            });
        }

        // ✅ Check for duplicate prescription (same patient, same note, same creator)
        const duplicate = await Prescription.findOne({
            patientMobile: mobile,
            createdBy,
            prescriptionNote
        });

        if (duplicate) {
            console.log("⚠️ Duplicate prescription found:", duplicate);
            return res.status(409).json({
                success: false,
                message: 'Duplicate prescription for this patient and creator.'
            });
        }

        // ✅ Save new prescription
        const newPrescription = new Prescription({
            patientMobile: mobile,
            prescriptionNote,
            createdBy
        });

        await newPrescription.save();
        console.log("✅ Prescription saved:", newPrescription);

        return res.status(201).json({
            success: true,
            message: 'Prescription added successfully',
            data: newPrescription
        });

    } catch (err) {
        console.error("🔥 Error in addPrescription:", err);
        return res.status(500).json({
            success: false,
            message: 'Failed to add prescription',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Get prescriptions for a specific report (reportId from URL param)
export const getPrescriptions = async (req, res) => {
    try {
        // Validate phone number from params
        const { error, value } = getPrescriptionsParamSchema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details.map(e => e.message)
            });
        }

        const { phoneNo } = value;
        const { search } = req.query;

        console.log("🔍 Looking for reports with mobile:", phoneNo);

        // 1️⃣ Find all reports matching this phone number
        const reports = await Report.find({ mobile: phoneNo });

        if (!reports || reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No reports found for this mobile number'
            });
        }

        const reportIds = reports.map(r => r._id);

        // 2️⃣ Build prescription search filter
        const searchFilter = {
            reportId: { $in: reportIds }
        };

        if (search) {
            searchFilter.prescriptionNote = { $regex: search, $options: 'i' };
        }

        // 3️⃣ Find prescriptions
        const prescriptions = await Prescription.find(searchFilter).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: prescriptions
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch prescriptions',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

export const getAllPrescriptions = async (req, res) => {
    try {
        // Validate query parameters
        const { error, value } = getAllPrescriptionsQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details.map(e => e.message)
            });
        }

        const { page, limit, search } = value;
        const skip = (page - 1) * limit;

        // 🔍 Search filter
        const searchFilter = search ? {
            $or: [
                { prescriptionNote: { $regex: search, $options: 'i' } },
                { createdBy: { $regex: search, $options: 'i' } }
            ]
        } : {};

        // Total count for pagination
        const total = await Prescription.countDocuments(searchFilter);

        const prescriptions = await Prescription.find(searchFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: prescriptions,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch all prescriptions',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};