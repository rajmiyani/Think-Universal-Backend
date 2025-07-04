import Mode from '../models/mode.model.js';
import { modeValidationSchema } from '../validations/validationSchema.js';
import mongoose from 'mongoose';

// Create a new mode with validation and uniqueness check
export const createMode = async (req, res) => {
    try {
        const { error, value } = modeValidationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details.map(e => e.message).join(', ')
            });
        }

        const doctorId = req.user.id;

        const exists = await Mode.findOne({
            doctor: doctorId,
            name: value.name,
            currency: value.currency
        });

        if (exists) {
            return res.status(409).json({ success: false, message: 'Mode already exists for this doctor' });
        }

        const mode = new Mode({
            ...value,
            doctor: doctorId
        });

        await mode.save();

        res.status(201).json({ success: true, mode });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
};


// Get all modes
export const getAllModes = async (req, res) => {
    try {
        const doctorId = req.user.id; // Doctor ID from token

        const modes = await Mode.find({ doctor: doctorId });

        res.json({ success: true, modes });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
};

// Toggle the isActive status of a mode, with ID validation
export const toggleModeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid mode ID format' });
        }

        const mode = await Mode.findById(id);
        if (!mode) {
            return res.status(404).json({ success: false, message: 'Mode not found' });
        }

        mode.isActive = !mode.isActive;
        await mode.save();

        res.json({
            success: true,
            message: `Mode ${mode.isActive ? 'enabled' : 'disabled'}`,
            mode
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
};
