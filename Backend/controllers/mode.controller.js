import Mode from '../models/mode.model.js';
import { modeValidationSchema } from '../validations/mode.validation.js';
import mongoose from 'mongoose';

// Create a new mode with validation and uniqueness check
export const createMode = async (req, res) => {
    try {
        // Validate input using Joi
        const { error, value } = modeValidationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details.map(e => e.message).join(', ')
            });
        }

        // Prevent duplicate mode for same name and currency
        const exists = await Mode.findOne({ name: value.name, currency: value.currency });
        if (exists) {
            return res.status(409).json({ success: false, message: 'Mode with this name and currency already exists' });
        }

        const mode = new Mode(value);
        await mode.save();

        res.status(201).json({ success: true, mode });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
};

// Get all modes
export const getAllModes = async (req, res) => {
    try {
        const modes = await Mode.find();
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
