import Dashboard from '../models/dashboard.model.js';
import moment from 'moment';
import { todayPatientsQuerySchema, dashboardSummaryQuerySchema, todayAppointmentsQuerySchema } from '../validations/validationSchema.js'
import appointmentModel from '../models/appointment.model.js';
import patientModel from '../models/mobileApp/patient.js';
import paymentModel from '../models/BankDetails.model.js';
import patient from '../models/mobileApp/patient.js';

// =====================================================================
// Helper Functions
// =====================================================================

/**
 * Formats key-value objects into sorted arrays
 * @param {Object} obj - The object to format
 * @param {string} keyLabel - Label for the key property
 * @param {string} valueLabel - Label for the value property
 * @returns {Array} Sorted array of objects
 */
// Helper: Format response as key-value array
export const formatKeyValue = (obj, keyName, valueName) => {
    return Object.entries(obj).map(([key, value]) => ({
        [keyName]: key,
        [valueName]: value
    }));
};

/**
 * Validates and parses date range parameters
 * @param {Object} query - Request query parameters
 * @returns {Object} Validated and parsed date range
 */
// Helper: Validate and format date range
export const validateDateRange = (query) => {
    const { startDate, endDate } = query;

    const start = startDate ? moment(startDate).startOf('day') : moment().startOf('month');
    const end = endDate ? moment(endDate).endOf('day') : moment().endOf('month');

    if (!start.isValid() || !end.isValid()) {
        throw new Error('Invalid date format');
    }

    if (start.isAfter(end)) {
        throw new Error('Start date must be before end date');
    }

    return {
        startDate: start.toDate(),
        endDate: end.toDate()
    };
};



// Graph 
export const getDashboardSummary = async (req, res) => {
    try {
        const { error, value } = dashboardSummaryQuerySchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                errors: error.details.map(e => e.message)
            });
        }

        const startDate = value.startDate
            ? moment(value.startDate).startOf("day")
            : moment().startOf("month");

        const endDate = value.endDate
            ? moment(value.endDate).endOf("day")
            : moment().endOf("month");

        // ✅ Fetch appointments directly from DB with date filter
        const appointments = await appointmentModel.find({
            date: {
                $gte: startDate.format("YYYY-MM-DD"),
                $lte: endDate.format("YYYY-MM-DD")
            }
        }).populate("userId", "_id name").lean();

        const appointmentCount = appointments.length;

        // ✅ Count by status (case-insensitive)
        const statusCount = {
            success: appointments.filter(a => a.status?.toLowerCase() === 'success').length,
            pending: appointments.filter(a =>
                ['pending', 'upcoming'].includes(a.status?.toLowerCase())
            ).length,
            cancel: appointments.filter(a => a.status?.toLowerCase() === 'cancel').length,
        };


        // ✅ Unique patient count
        const uniquePatients = new Set(
            appointments.map(a => a.userId?._id?.toString() || a.name)
        );

        // ✅ Revenue from payments
        const payments = await paymentModel.find({
            date: {
                $gte: startDate.toDate(),
                $lte: endDate.toDate()
            }
        }).lean();

        const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // ✅ Average duration (if your model includes 'duration')
        const totalDuration = appointments.reduce((sum, a) => sum + (a.duration || 0), 0);
        const avgDuration = appointmentCount > 0 ? Math.round(totalDuration / appointmentCount) : 0;

        // ✅ Save snapshot (optional)
        await Dashboard.create({
            date: new Date(),
            revenue: totalRevenue,
            appointments: appointmentCount,
            patients: uniquePatients.size,
            avgDuration,
            rangeStart: startDate.toDate(),
            rangeEnd: endDate.toDate()
        });

        // ✅ Return all metrics
        return res.status(200).json({
            success: true,
            data: {
                revenue: totalRevenue,
                appointments: appointmentCount,
                appointmentStatus: statusCount,
                patients: uniquePatients.size,
                avgDuration
            },
            meta: {
                period: value.startDate || value.endDate ? "custom-range" : "current-month",
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            }
        });

    } catch (err) {
        console.error("❌ Dashboard summary error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to generate dashboard summary",
            error: err.message
        });
    }
};

// Revenue Graph
export const getRevenueTrends = async (req, res) => {
    try {
        // 1. Validate date range
        let dateRange;
        try {
            dateRange = validateDateRange(req.query);
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date range',
                errors: [validationError.message]
            });
        }

        // 2. Fetch dashboard data
        const records = await Dashboard.find({
            date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
        });

        const yearly = {};
        const monthly = {};
        const weekly = {};

        // 3. Aggregate revenue trends
        records.forEach(record => {
            const date = moment(record.date);
            const year = date.format('YYYY');
            const month = date.format('YYYY-MM');
            const week = date.format('GGGG-[W]WW');

            yearly[year] = (yearly[year] || 0) + (record.revenue || 0);
            monthly[month] = (monthly[month] || 0) + (record.revenue || 0);
            weekly[week] = (weekly[week] || 0) + (record.revenue || 0);
        });

        // 4. Return formatted response
        res.status(200).json({
            success: true,
            data: {
                yearly: formatKeyValue(yearly, 'year', 'revenue'),
                monthly: formatKeyValue(monthly, 'month', 'revenue'),
                weekly: formatKeyValue(weekly, 'week', 'revenue')
            },
            meta: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            }
        });

    } catch (err) {
        console.error('❌ Revenue trends error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to generate revenue trends',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

export const getTodayPatients = async (req, res) => {
    try {
        // Validate query parameters
        const { error, value } = todayPatientsQuerySchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details.map(e => e.message)
            });
        }

        // Calculate today's date range
        const startOfDay = moment().startOf("day").toDate();
        const endOfDay = moment().endOf("day").toDate();

        // Build query with optional filters
        const query = {
            date: { $gte: startOfDay, $lte: endOfDay }
        };
        if (value.doctorName) query.doctorName = value.doctorName;
        if (value.status) query.status = value.status;

        // Fetch data from database
        const patients = await patient.find(query)
            .select("patientName doctorName date status appointmentType duration revenue")
            .sort({ date: 1 })
            .lean();

        // Format response data
        const formatted = patients.map(p => ({
            patientName: p.patientName,
            doctorName: p.doctorName,
            time: moment(p.date).format("hh:mm A"),
            status: p.status,
            type: p.appointmentType,
            duration: p.duration,
            revenue: p.revenue
        }));

        // Prepare response
        res.status(200).json({
            success: true,
            data: formatted,
            meta: {
                date: new Date().toISOString().split('T')[0],
                filters: {
                    doctorName: value.doctorName || 'any',
                    status: value.status || 'any'
                }
            }
        });
    } catch (err) {
        console.error("Error fetching today's patients:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch today's patients",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

export const getTodayAppointment = async (req, res) => {
    try {
        // ✅ Validate query parameters
        const { error, value } = todayAppointmentsQuerySchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details.map(e => e.message)
            });
        }

        // 📅 Today's date range
        const startOfDay = moment().startOf("day").toDate();
        const endOfDay = moment().endOf("day").toDate();

        // 🔍 Build query
        const query = {
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        };

        if (value.doctorId) query.doctorId = value.doctorId;
        if (value.status) query.status = value.status;

        // 📦 Fetch data
        const appointments = await appointmentModel.find(query)
            .populate("doctorId", "firstName lastName") // optional
            .populate("userId", "firstName lastName")   // optional
            .select("date timeSlot status modeId price")
            .sort({ createdAt: 1 })
            .lean();

        // 📋 Format response
        const formatted = appointments.map(appt => ({
            patient: appt.userId?.firstName || "N/A",
            doctor: appt.doctorId?.firstName || "N/A",
            time: moment(appt.date).format("hh:mm A"),
            price: appt.price,
            status: appt.status,
            modeId: appt.modeId,
            timeSlot: appt.timeSlot,
        }));

        // ✅ Final response
        res.status(200).json({
            success: true,
            data: formatted,
            meta: {
                date: new Date().toISOString().split("T")[0],
                filters: {
                    doctorId: value.doctorId || "any",
                    status: value.status || "any"
                }
            }
        });

    } catch (err) {
        console.error("❌ Error fetching today's appointments:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch today's appointments",
            error: process.env.NODE_ENV === "development" ? err.message : undefined
        });
    }
};