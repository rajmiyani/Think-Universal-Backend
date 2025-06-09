import Patient from '../models/patient.model.js';
import Joi from 'joi';



// --- Validation Schema ---
const patientSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\d{10,15}$/).required(),
    gender: Joi.string().valid('Male', 'Female', 'Other').required(),
    age: Joi.number().min(0).max(120).required(),
    address: Joi.string().min(5).max(200).required(),
});



export const addPatient = async (req, res) => {
    try {
        // Validate input
        const { error, value } = patientSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(', ') });
        }

        // Check for duplicate email
        const existing = await Patient.findOne({ email: value.email });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Email already exists' });
        }

        const patient = await Patient.create(value);
        res.status(201).json({ success: true, patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllPatients = async (req, res) => {
    try {
        const patients = await Patient.find();
        res.status(200).json({ success: true, patients });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        res.status(200).json({ success: true, patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
