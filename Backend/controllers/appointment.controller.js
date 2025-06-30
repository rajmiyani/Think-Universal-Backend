import Appointment from '../models/mobileApp/appointment.js';
import mongoose from "mongoose";
import doctorModel from '../models/doctor.model.js';
import { appointmentSchema, validateQuery } from '../validations/validationSchema.js'
import MobileAppointment from '../models/mobileApp/appointment.js';
import AdminAppointment from '../models/appointment.model.js';

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

export const getAppointments = async (req, res) => {
    try {
        const { doctorId } = req.query;

        const filter = {};
        if (doctorId) filter.doctorId = doctorId; // ✅ Only fetch appointments for this doctor

        const appointments = await MobileAppointment.find(filter).lean();

        let inserted = 0;
        let skipped = 0;
        const synced = [];

        for (const appt of appointments) {
            const exists = await AdminAppointment.findOne({
                userId: appt.userId,
                doctorId: appt.doctorId,
                date: appt.date,
                timeSlot: appt.timeSlot
            });

            if (exists) {
                skipped++;
                continue;
            }

            try {
                const newAppt = await AdminAppointment.create({
                    ...appt,
                    _id: undefined // Let MongoDB generate new _id
                });

                inserted++;
                synced.push(newAppt);
            } catch (err) {
                console.warn(`❌ Failed to insert appointment ${appt._id}:`, err.message);
                skipped++;
            }
        }

        const finalAppointments = await AdminAppointment.find({ doctorId }).sort({ date: -1 });
        console.log(finalAppointments);

        return res.status(200).json({
            success: true,
            message: '✅ Appointment sync completed',
            inserted,
            skipped,
            totalFetched: appointments.length,
            appointments: finalAppointments
        });

    } catch (err) {
        console.error('❌ Sync error:', err);
        return res.status(500).json({
            success: false,
            message: 'Sync failed',
            error: err.message
        });
    }
};


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