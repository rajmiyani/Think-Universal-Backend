import Appointment from '../models/appointment.model.js';
import Joi from 'joi';



// --- Validation Schemas ---
const appointmentSchema = Joi.object({
    doctor: Joi.string().required(),
    patient: Joi.string().required(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    status: Joi.string().valid('pending', 'approved', 'completed', 'cancelled').optional(),
    prescription: Joi.string().max(1000).optional().allow(''),
});

const statusSchema = Joi.object({
    status: Joi.string().valid('pending', 'approved', 'completed', 'cancelled').required(),
});

const prescriptionSchema = Joi.object({
    prescription: Joi.string().max(1000).required(),
});




export const createAppointment = async (req, res) => {
    try {
        // Validate input
        const { error, value } = appointmentSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(', ') });
        }

        const appointment = await Appointment.create(value);
        res.status(201).json({ success: true, appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAppointmentsByDoctor = async (req, res) => {
    try {
        const appointments = await Appointment.find({ doctor: req.params.doctorId })
            .populate('patient')
            .sort({ date: 1 });
        res.status(200).json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAppointmentStatus = async (req, res) => {
    try {
        // Validate status
        const { error, value } = statusSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(', ') });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: value.status },
            { new: true }
        );
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        res.status(200).json({ success: true, appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addPrescription = async (req, res) => {
    try {
        // Validate prescription
        const { error, value } = prescriptionSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(', ') });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { prescription: value.prescription },
            { new: true }
        );
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        res.status(200).json({ success: true, appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
