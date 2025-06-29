import Appointment from '../models/mobileApp/appointment.js';
import mongoose from "mongoose";
import { appointmentSchema, validateQuery } from '../validations/validationSchema.js'
import doctorModel from '../models/doctor.model.js';

// Middleware for input sanitization
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        Object.entries(req.body).forEach(([key, value]) => {
            if (typeof value === 'string') req.body[key] = value.trim();
        });
    }
    next();
};

// Add this function before you use it in exportCSV
const validateExportParams = (req, res, next) => {
    const { error } = Joi.object({
        name: Joi.string().allow('').default(''),
        doctor: Joi.string().hex().length(24).allow(''),
        status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'all').default('all')
    }).validate(req.query);

    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};


// Get all appointments with filters & pagination
export const getAppointments = async (req, res) => {
    try {
        const query = { userId: { $ne: null } };

        const appointments = await Appointment.find(query).lean();

        // Get unique doctorIds
        const doctorIds = [...new Set(appointments.map(a => a.doctorId?.toString()))];

        // Fetch doctor info from Admin DB
        const doctors = await doctorModel.find({ _id: { $in: doctorIds } })
            .select('firstName lastName')
            .lean();

        const doctorMap = {};
        doctors.forEach(doc => {
            doctorMap[doc._id.toString()] = `${doc.firstName} ${doc.lastName}`;
        });

        const updatedAppointments = appointments.map(appt => ({
            ...appt,
            doctorName: doctorMap[appt.doctorId?.toString()] || 'Unknown Doctor',
        }));

        res.status(200).json({
            success: true,
            data: updatedAppointments,
            totalRecords: updatedAppointments.length
        });
    } catch (err) {
        console.error('❌ Appointment fetch error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointments',
            error: err.message
        });
    }
};






// Create new appointment

export const createAppointment = [
    sanitizeInput,
    async (req, res) => {
        try {
            const { error, value } = appointmentSchema.validate(req.body);
            if (error) return res.status(400).json({ message: error.details[0].message });

            // Verify doctor exists
            const doctor = await mongoose.model('Doctor').findById(value.doctor).select('firstName lastName');
            if (!doctor) return res.status(400).json({ message: "Doctor not found" });

            const appointment = new Appointment(value);
            const saved = await appointment.save();

            const result = saved.toObject();
            delete result.__v;

            // Add doctor name to result
            result.doctorName = `${doctor.firstName} ${doctor.lastName}`;

            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ message: "Invalid data", error: error.message });
        }
    }
];

// Secure exports with rate limiting in production
export const exportCSV = [
    validateExportParams,
    async (req, res) => {
        try {
            const { name, doctor, status } = req.query;
            const query = { name: { $regex: name, $options: "i" } };

            if (doctor) {
                if (!mongoose.Types.ObjectId.isValid(doctor)) {
                    return res.status(400).json({ message: "Invalid doctor ID format" });
                }
                query.doctor = doctor;
            }

            if (status !== 'all') query.status = status;

            const appointments = await Appointment.find(query)
                .sort({ date: 1 })
                .limit(1000) // Prevent DOS attacks
                .lean();

            const fields = ["name", "date", "time", "age", "doctor", "meetingMode", "paymentMethod", "status"];
            const parser = new Parser({ fields });
            const csv = parser.parse(appointments);

            res.header("Content-Type", "text/csv");
            res.attachment("appointments.csv");
            res.send(csv);
        } catch (error) {
            res.status(500).json({ message: "Export failed" });
        }
    }
];