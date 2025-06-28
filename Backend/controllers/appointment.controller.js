import Appointment from "../models/appointment.model.js";
import mongoose from "mongoose";
import { appointmentSchema, validateQuery } from '../validations/validationSchema.js'

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
        // ✅ Step 1: Validate query parameters
        const { error, value } = validateQuery(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                error: error.details[0].message,
            });
        }

        const { name, doctor, status, page, limit } = value;

        // ✅ Step 2: Build dynamic MongoDB query
        const query = {
            userId: { $exists: true }  // ✅ Only get appointments from mobile app
        };

        if (name?.trim()) {
            query.name = { $regex: name.trim(), $options: "i" };
        }

        if (doctor) {
            query.doctor = doctor;
        }

        if (status !== "all") {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        // ✅ Step 3: Query database
        const [appointments, total] = await Promise.all([
            Appointment.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ date: 1 })
                .populate('doctor', 'firstName lastName')
                .lean(),
            Appointment.countDocuments(query),
        ]);

        // ✅ Step 4: Format results with doctor name
        const updatedAppointments = appointments.map(appt => ({
            ...appt,
            doctorName: appt.doctor ? `${appt.doctor.firstName} ${appt.doctor.lastName}` : null,
        }));

        // ✅ Step 5: Return JSON
        res.status(200).json({
            success: true,
            data: updatedAppointments,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalRecords: total,
            pageSize: limit,
        });
    } catch (err) {
        console.error("Appointment fetch error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch appointments",
            error: err.message,
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