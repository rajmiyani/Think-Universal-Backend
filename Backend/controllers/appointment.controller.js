import Appointment from '../models/mobileApp/appointment.js';
import mongoose from "mongoose";
import doctorModel from '../models/doctor.model.js';
import { appointmentSchema, validateQuery } from '../validations/validationSchema.js'
import MobileAppointment from '../models/mobileApp/appointment.js';
import AdminAppointment from '../models/appointment.model.js';
import dayjs from 'dayjs';

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


export const setAppointments = async (req, res) => {
  try {
    const doctorId = req.user?.id;

    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: "Invalid or missing doctor ID" });
    }

    const appointmentData = {
      doctorId,
      userId: "64bdf1c7c0a7c57a7b5a8123",
      date: "2025-07-05",
      timeSlot: "64c122b8c0a7c57a7b5a8111",
      modeId: "64c33313c0a7c57a7b5a8133",
      price: 500,
      name: "John Doe",
      ageRange: "30-35",
      contactNumber: "9876543210",
      gender: "Male",
      problem: "Headache",
      paymentMode: "UPI",
      paymentStatus: "Done",
      status: "Upcoming",
      isOther: false,
    };

    console.log("📦 Saving appointment data:", appointmentData);

    const newAppointment = await MobileAppointment.create(appointmentData);

    console.log("✅ Saved appointment:", newAppointment);

    return res.status(201).json({
      success: true,
      message: "Appointment successfully set in mobile DB",
      appointment: newAppointment
    });

  } catch (error) {
    console.error("❌ setAppointments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to set appointment",
      error: error.message
    });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const doctorId = req.user?.id;

    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing doctor ID in token' });
    }

    // 🔁 Step 1: Fetch all mobile appointments
    const mobileAppointments = await MobileAppointment.find({ doctorId }).lean();

    let inserted = 0;
    let skipped = 0;
    const synced = [];

    for (const appt of mobileAppointments) {
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
          _id: undefined // Let MongoDB assign new _id
        });

        inserted++;
        synced.push(newAppt);
      } catch (err) {
        console.warn(`❌ Failed to insert appointment ${appt._id}:`, err.message);
        skipped++;
      }
    }

    // 🧹 Step 2: Delete expired appointments based on date only
    const today = dayjs().format('YYYY-MM-DD');

    await AdminAppointment.deleteMany({
      doctorId,
      date: { $lt: today }
    });

    // 📤 Step 3: Fetch updated list of appointments
    const appointments = await AdminAppointment.find({ doctorId }).sort({ date: -1 });

    return res.status(200).json({
      success: true,
      message: '✅ Appointment sync completed',
      inserted,
      skipped,
      totalFetched: mobileAppointments.length,
      appointments
    });

  } catch (err) {
    console.error('❌ getAppointments error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
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