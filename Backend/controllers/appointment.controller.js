import Appointment from "../models/appointment.model.js";
import mongoose from "mongoose";


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
        const { name = "", doctor = "", status = "", page = 1, limit = 5 } = req.query;
        const query = {
            name: { $regex: name, $options: "i" },
        };
        if (doctor) query.doctor = doctor;
        if (status && status !== "all") query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [appointments, total] = await Promise.all([
            Appointment.find(query).skip(skip).limit(parseInt(limit)).sort({ date: 1 }),
            Appointment.countDocuments(query),
        ]);

        res.status(200).json({
            data: appointments,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch appointments", error: error.message });
    }
};

// View single appointment
// export const getAppointmentsByDoctor = async (req, res) => {
//     try {
//         const appointment = await Appointment.findById(req.params.doctorId);
//         if (!appointment) return res.status(404).json({ message: "Not found" });
//         res.status(200).json(appointment);
//     } catch (error) {
//         res.status(500).json({ message: "Failed to fetch", error: error.message });
//     }
// };

// Create new appointment (with validation)
export const createAppointment = [
    sanitizeInput,
    async (req, res) => {
        try {
            const { error, value } = appointmentSchema.validate(req.body);
            if (error) return res.status(400).json({ message: error.details[0].message });

            // Verify doctor exists
            const doctorExists = await mongoose.model('Doctor').exists({ _id: value.doctor });
            if (!doctorExists) return res.status(400).json({ message: "Doctor not found" });

            const appointment = new Appointment(value);
            const saved = await appointment.save();
            const result = saved.toObject();
            delete result.__v;

            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ message: "Invalid data", error: error.message });
        }
    }
];

// Update appointment (with validation)
// export const updateAppointment = [
//     sanitizeInput,
//     async (req, res) => {
//         try {
//             const { error, value } = appointmentSchema.validate(req.body);
//             if (error) return res.status(400).json({ message: error.details[0].message });

//             const updated = await Appointment.findByIdAndUpdate(
//                 req.params.id,
//                 value,
//                 { new: true, runValidators: true }
//             ).lean();

//             if (!updated) return res.status(404).json({ message: "Appointment not found" });
//             delete updated.__v;

//             res.status(200).json(updated);
//         } catch (error) {
//             res.status(400).json({ message: "Update failed", error: error.message });
//         }
//     }
// ];

// Delete appointment (with authorization check)
// export const deleteAppointment = async (req, res) => {
//     try {
//         const deleted = await Appointment.findByIdAndDelete(req.params.id);
//         if (!deleted) return res.status(404).json({ message: "Appointment not found" });
//         res.status(200).json({ message: "Deleted" });
//     } catch (error) {
//         res.status(400).json({ message: "Failed to delete" });
//     }
// };


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