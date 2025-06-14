import Prescription from '../models/prescription.model.js';
import { getPrescriptionsParamSchema, prescriptionSchema, getAllPrescriptionsQuerySchema } from '../validations/validationSchema.js'

// Add prescription to report (reportId from URL param, createdBy from user)
export const addPrescription = async (req, res) => {
    try {
        console.log("API Hit");

        // Validate prescriptionNote in body
        const { error, value } = prescriptionSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details.map(e => e.message)
            });
        }

        // Validate reportId in params
        const { error: paramError, value: paramValue } = getPrescriptionsParamSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
        if (paramError) {
            return res.status(400).json({
                success: false,
                errors: paramError.details.map(e => e.message)
            });
        }

        // const reportId = paramValue.reportId;
        // console.log("Report Id : ", reportId);

        const createdBy = req.user?.name || 'Unknown';

        // Optional: Check for duplicate prescription for same report and creator
        const duplicate = await Prescription.findOne({
            // reportId,
            createdBy,
            prescriptionNote: value.prescriptionNote
        });
        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: 'Duplicate prescription detected for this report and creator.'
            });
        }

        const newPrescription = new Prescription({
            // reportId,
            prescriptionNote: value.prescriptionNote,
            createdBy
        });
        await newPrescription.save();

        // Sanitize output
        const result = newPrescription.toObject();
        delete result.__v;

        res.status(201).json({
            success: true,
            message: 'Prescription added successfully',
            data: result
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to add prescription',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Get prescriptions for a specific report (reportId from URL param)
export const getPrescriptions = async (req, res) => {
    try {
        // Validate reportId in params
        const { error, value } = getPrescriptionsParamSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details.map(e => e.message)
            });
        }

        const prescriptions = await Prescription.find({ reportId: value.reportId }).sort({ createdAt: -1 });

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
        const { page, limit } = value;
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const total = await Prescription.countDocuments();

        // Paginated fetch
        const prescriptions = await Prescription.find()
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