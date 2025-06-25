import Dashboard from '../models/dashboard.model.js';
import moment from 'moment';
import { todayPatientsQuerySchema, dashboardSummaryQuerySchema } from '../validations/validationSchema.js'
import appointmentModel from '../models/appointment.model.js';
import patientModel from '../models/patient.model.js';
import paymentModel from '../models/BankDetails.model.js';

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
const formatKeyValue = (obj, keyLabel, valueLabel) => {
    return Object.entries(obj)
        .map(([key, value]) => ({ [keyLabel]: key, [valueLabel]: value }))
        .sort((a, b) => a[keyLabel].localeCompare(b[keyLabel]));
};

/**
 * Validates and parses date range parameters
 * @param {Object} query - Request query parameters
 * @returns {Object} Validated and parsed date range
 */
const validateDateRange = async (query) => {
    const { error, value } = dateRangeSchema.validate(query);
    if (error) {
        throw new Error(error.details.map(e => e.message).join(', '));
    }
    return {
        startDate: moment(value.startDate).startOf('day').toDate(),
        endDate: moment(value.endDate).endOf('day').toDate()
    };
};

// =====================================================================
// Analytics Controller Functions
// =====================================================================

/**
 * Retrieves dashboard summary for the current month
 * - Total revenue
 * - Appointment count
 * - Unique patient count
 * - Average appointment duration
 */
export const getDashboardSummary = async (req, res) => {
    try {
        // 1. Validate optional date range from query
        const { error, value } = dashboardSummaryQuerySchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: error.details.map(e => e.message)
            });
        }

        // 2. Calculate date range
        const startDate = value.startDate
            ? moment(value.startDate).startOf('day').toDate()
            : moment().startOf('month').toDate();

        const endDate = value.endDate
            ? moment(value.endDate).endOf('day').toDate()
            : moment().endOf('month').toDate();

        // 3. Fetch appointments within the range
        const appointments = await appointmentModel.find({
            date: { $gte: startDate, $lte: endDate }
        }).populate('patient', '_id name').lean();
        console.log("🧾 All Appointments:", appointments);

        const appointmentCount = appointments.length;
        const totalDuration = appointments.reduce((sum, a) => sum + (a.duration || 0), 0);
        const avgDuration = appointmentCount > 0 ? Math.round(totalDuration / appointmentCount) : 0;

        // 4. Count unique patients
        const patientSet = new Set(
            appointments.map(a => a.patient?._id?.toString() || a.patientName)
        );
        const patientCount = patientSet.size;

        // 5. Fetch revenue data
        const payments = await paymentModel.find({
            date: { $gte: startDate, $lte: endDate }
        }).lean();
        console.log("payments",payments);

        const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // 6. Save summary snapshot to Dashboard model
        await Dashboard.create({
            date: new Date(),
            revenue: totalRevenue,
            appointments: appointmentCount,
            patients: patientCount,
            avgDuration,
            rangeStart: startDate,
            rangeEnd: endDate
        });

        // 7. Return response
        res.json({
            success: true,
            data: {
                revenue: totalRevenue,
                appointments: appointmentCount,
                patients: patientCount,
                avgDuration
            },
            meta: {
                period: value.startDate || value.endDate ? 'custom-range' : 'current-month',
                startDate,
                endDate
            }
        });

    } catch (err) {
        console.error('❌ Dashboard summary error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to generate dashboard summary',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

/**
 * Retrieves comprehensive revenue trends:
 * - Yearly revenue by year
 * - Monthly revenue by month
 * - Weekly revenue by week
 */
export const getRevenueTrends = async (req, res) => {
    try {
        // Validate and parse date range
        let dateRange;
        try {
            dateRange = await validateDateRange(req.query);
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date range',
                errors: [validationError.message]
            });
        }

        // Fetch data from database
        const data = await Dashboard.find({
            date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
        });

        // Initialize trend accumulators
        const yearly = {};
        const monthly = {};
        const weekly = {};

        // Aggregate revenue data
        data.forEach(record => {
            const date = moment(record.date);
            const year = date.format('YYYY');
            const month = date.format('YYYY-MM');
            const week = date.format('GGGG-[W]WW');

            // Yearly revenue
            yearly[year] = (yearly[year] || 0) + (record.revenue || 0);

            // Monthly revenue
            monthly[month] = (monthly[month] || 0) + (record.revenue || 0);

            // Weekly revenue
            weekly[week] = (weekly[week] || 0) + (record.revenue || 0);
        });

        // Prepare response
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
        console.error('Revenue trends error:', err);
        res.status(500).json({
            success: false,
            message: "Failed to generate revenue trends",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

/**
 * Retrieves today's patient appointments with filtering options
 * - Filterable by doctor name and appointment status
 * - Returns formatted appointment details
 */
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
        const patients = await Dashboard.find(query)
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