import Prescription from '../models/prescription.model.js';
import { getPrescriptionsParamSchema, prescriptionSchema, getAllPrescriptionsQuerySchema } from '../validations/validationSchema.js'

// Add prescription to report (reportId from URL param, createdBy from user)
export const addPrescription = async (req, res) => {
    try {
        console.log("API Hit");

        // ✅ Validate prescriptionNote and patient info
        const { error, value } = prescriptionSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details.map(e => e.message)
            });
        }

        const { firstName, lastName, prescriptionNote } = value;

        // ✅ Find report by patient name
        const report = await Report.findOne({
            firstName: new RegExp('^' + firstName + '$', 'i'),
            lastName: new RegExp('^' + lastName + '$', 'i')
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'No report found for the specified patient name.'
            });
        }

        const createdBy = req.user?.name || 'Unknown';

        // ❌ Prevent duplicate prescriptions
        const duplicate = await Prescription.findOne({
            reportId: report._id,
            createdBy,
            prescriptionNote
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: 'Duplicate prescription detected for this report and creator.'
            });
        }

        // ✅ Save prescription
        const newPrescription = new Prescription({
            reportId: report._id,
            prescriptionNote,
            createdBy
        });

        await newPrescription.save();

        const result = newPrescription.toObject();
        delete result.__v;

        return res.status(201).json({
            success: true,
            message: 'Prescription added successfully',
            data: result
        });
    } catch (err) {
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
        const { error, value } = getPrescriptionsParamSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details.map(e => e.message)
            });
        }

        const { search } = req.query;

        const searchFilter = {
            reportId: value.reportId
        };

        if (search) {
            searchFilter.prescriptionNote = { $regex: search, $options: 'i' };
        }

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