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

        const phoneNo = value.phoneNo.toString().trim();
        const { search } = req.query;

        console.log("📱 Fetching last prescription for:", phoneNo);

        const filter = {
            patientMobile: phoneNo
        };

        if (search) {
            filter.prescriptionNote = { $regex: search, $options: 'i' };
        }

        // ✅ Get only the latest one
        const lastPrescription = await Prescription
            .findOne(filter)
            .sort({ createdAt: -1 }); // Latest first

        if (!lastPrescription) {
            return res.status(404).json({
                success: false,
                message: 'No prescription found for this mobile number'
            });
        }

        return res.status(200).json({
            success: true,
            data: lastPrescription
        });

    } catch (err) {
        console.error("🔥 Error in getPrescriptions:", err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch prescription',
            error: err.message
        });
    }
};


export const getPrescriptionsByDoctor = async (req, res) => {
    try {
        const doctor = req.params.doctorName?.trim();
        const { search } = req.query;

        console.log("🔍 Doctor name from params:", doctor);
        console.log("🔍 Search keyword:", search);

        if (!doctor) {
            return res.status(400).json({
                success: false,
                message: "Doctor name is required in URL"
            });
        }

        // Step 1: Get all reports by this doctor
        const reports = await Report.find({ doctor });
        console.log("📋 Total reports found:", reports.length);
        console.log("📋 Reports:", reports);

        if (!reports || reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No reports found for this doctor"
            });
        }

        const mobileMap = {}; // Map mobile to patient info
        reports.forEach(r => {
            mobileMap[r.mobile] = {
                fullName: `${r.firstName} ${r.lastName}`,
                date: r.date,
                mobile: r.mobile
            };
        });

        const mobiles = Object.keys(mobileMap);
        console.log("📱 Patient mobiles extracted from reports:", mobiles);

        // Step 2: Filter prescriptions by patientMobile and createdBy
        const filter = {
            patientMobile: { $in: mobiles },
            createdBy: doctor
        };

        if (search) {
            filter.prescriptionNote = { $regex: search, $options: 'i' };
        }

        console.log("🔍 Final prescription filter:", filter);

        const prescriptions = await Prescription.find(filter).sort({ createdAt: -1 });
        console.log("📜 Prescriptions found:", prescriptions.length);

        // Step 3: Attach patient details to each prescription
        const enriched = prescriptions.map(p => ({
            ...p.toObject(),
            patientInfo: mobileMap[p.patientMobile] || {}
        }));

        console.log("✅ Enriched prescriptions:", enriched);

        return res.status(200).json({
            success: true,
            data: enriched
        });

    } catch (err) {
        console.error("🔥 Error in getPrescriptionsByDoctor:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to get prescriptions by doctor",
            error: err.message
        });
    }
};


export const updatePrescription = async (req, res) => {
    try {
        const { phoneNo } = req.params;
        const { prescriptionNote } = req.body;
        const createdBy = req.user?.name;

        if (!prescriptionNote || prescriptionNote.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Prescription note must be at least 10 characters'
            });
        }

        if (!createdBy) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: doctor not found from token'
            });
        }

        // 🔍 Find the latest prescription for this doctor and patient
        const latest = await Prescription.findOne({
            patientMobile: phoneNo,
            createdBy
        }).sort({ createdAt: -1 });

        if (!latest) {
            return res.status(404).json({
                success: false,
                message: 'No prescription found for this patient and doctor'
            });
        }

        latest.prescriptionNote = prescriptionNote;
        await latest.save();

        return res.status(200).json({
            success: true,
            message: 'Prescription updated successfully',
            data: latest
        });

    } catch (err) {
        console.error("🔥 Error in updateLatestPrescription:", err);
        return res.status(500).json({
            success: false,
            message: 'Failed to update prescription',
            error: err.message
        });
    }
};