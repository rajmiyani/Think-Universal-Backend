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
        // ✅ 1. Validate query params
        const { error, value } = dashboardSummaryQuerySchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: error.details.map(e => e.message)
            });
        }

        // ✅ 2. Date range
        const startDate = value.startDate
            ? moment(value.startDate).startOf('day').toDate()
            : moment().startOf('month').toDate();

        const endDate = value.endDate
            ? moment(value.endDate).endOf('day').toDate()
            : moment().endOf('month').toDate();

        // ✅ 3. Fetch appointments in date range
        const appointments = await appointmentModel.find({
            date: { $gte: startDate, $lte: endDate }
        }).lean();

        const appointmentCount = appointments.length;
        const totalDuration = appointments.reduce((sum, d) => sum + (d.duration || 0), 0);
        const avgDuration = appointmentCount > 0 ? Math.round(totalDuration / appointmentCount) : 0;

        // ✅ 4. Count unique patients (by ID or name)
        const patientIds = new Set(appointments.map(a => a.patient?.toString() || a.patientName)).size;

        // ✅ 5. Sum revenue from payment model
        const payments = await paymentModel.find({
            date: { $gte: startDate, $lte: endDate }
        }).lean();

        const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // ✅ 6. Return response
        res.json({
            success: true,
            data: {
                revenue: totalRevenue,
                appointments: appointmentCount,
                patients: patientIds,
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
            message: "Failed to generate dashboard summary",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

/**
 * Retrieves weekly revenue trend for the current week
 * - Day-by-day revenue breakdown
 * - Includes all days of week (even with zero revenue)
 */
export const getWeeklyRevenueTrend = async (req, res) => {
    try {
        // Calculate date range for current week
        const startOfWeek = moment().startOf('isoWeek').toDate();
        const endOfWeek = moment().endOf('isoWeek').toDate();

        // Fetch data from database
        const data = await Dashboard.find({
            date: { $gte: startOfWeek, $lte: endOfWeek }
        });

        // Generate day-by-day revenue trend
        const trend = Array.from({ length: 7 }, (_, i) => {
            const day = moment(startOfWeek).add(i, 'days');
            const dayData = data.filter(d => moment(d.date).isSame(day, 'day'));
            const totalRevenue = dayData.reduce((sum, d) => sum + (d.revenue || 0), 0);
            const appointmentCount = dayData.length;

            return {
                date: day.toISOString(),
                day: day.format('ddd'),
                revenue: totalRevenue,
                appointments: appointmentCount
            };
        });

        // Prepare response
        res.json({
            success: true,
            data: trend,
            meta: {
                period: 'current-week',
                startDate: startOfWeek,
                endDate: endOfWeek
            }
        });
    } catch (err) {
        console.error('Weekly trend error:', err);
        res.status(500).json({
            success: false,
            message: "Failed to generate weekly revenue trend",
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

/**
 * Retrieves doctor performance metrics
 * - Revenue by doctor
 * - Appointment count by doctor
 * - Average rating
 */
export const getDoctorPerformance = async (req, res) => {
    try {
        // Validate date range
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

        // Aggregate doctor performance data
        const results = await Dashboard.aggregate([
            {
                $match: {
                    date: {
                        $gte: dateRange.startDate,
                        $lte: dateRange.endDate
                    }
                }
            },
            {
                $group: {
                    _id: "$doctorName",
                    totalRevenue: { $sum: "$revenue" },
                    appointmentCount: { $sum: 1 },
                    averageDuration: { $avg: "$duration" }
                }
            },
            {
                $project: {
                    _id: 0,
                    doctorName: "$_id",
                    totalRevenue: 1,
                    appointmentCount: 1,
                    averageDuration: { $round: ["$averageDuration", 1] }
                }
            },
            {
                $sort: { totalRevenue: -1 }
            }
        ]);

        // Prepare response
        res.status(200).json({
            success: true,
            data: results,
            meta: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            }
        });
    } catch (err) {
        console.error('Doctor performance error:', err);
        res.status(500).json({
            success: false,
            message: "Failed to generate doctor performance report",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

/**
 * Retrieves appointment type distribution
 * - Count by appointment type
 * - Revenue by appointment type
 */
export const getAppointmentTypeAnalysis = async (req, res) => {
    try {
        // Validate date range
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

        // Aggregate appointment type data
        const results = await Dashboard.aggregate([
            {
                $match: {
                    date: {
                        $gte: dateRange.startDate,
                        $lte: dateRange.endDate
                    }
                }
            },
            {
                $group: {
                    _id: "$appointmentType",
                    count: { $sum: 1 },
                    totalRevenue: { $sum: "$revenue" },
                    averageRevenue: { $avg: "$revenue" }
                }
            },
            {
                $project: {
                    _id: 0,
                    type: "$_id",
                    count: 1,
                    totalRevenue: 1,
                    averageRevenue: { $round: ["$averageRevenue", 2] }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Prepare response
        res.status(200).json({
            success: true,
            data: results,
            meta: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            }
        });
    } catch (err) {
        console.error('Appointment type analysis error:', err);
        res.status(500).json({
            success: false,
            message: "Failed to generate appointment type analysis",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

/**
 * Retrieves patient retention metrics
 * - New vs returning patients
 * - Patient visit frequency
 */
export const getPatientRetention = async (req, res) => {
    try {
        // Validate date range
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

        // Aggregate patient retention data
        const results = await Dashboard.aggregate([
            {
                $match: {
                    date: {
                        $gte: dateRange.startDate,
                        $lte: dateRange.endDate
                    }
                }
            },
            {
                $group: {
                    _id: "$patientName",
                    firstVisit: { $min: "$date" },
                    lastVisit: { $max: "$date" },
                    visitCount: { $sum: 1 },
                    totalSpent: { $sum: "$revenue" }
                }
            },
            {
                $project: {
                    _id: 0,
                    patientName: "$_id",
                    firstVisit: 1,
                    lastVisit: 1,
                    visitCount: 1,
                    totalSpent: 1,
                    visitFrequency: {
                        $divide: [
                            { $subtract: ["$lastVisit", "$firstVisit"] },
                            { $multiply: [1000, 60, 60, 24] }
                        ]
                    }
                }
            },
            {
                $sort: { visitCount: -1 }
            }
        ]);

        // Calculate metrics
        const totalPatients = results.length;
        const returningPatients = results.filter(p => p.visitCount > 1).length;
        const retentionRate = totalPatients > 0
            ? Math.round((returningPatients / totalPatients) * 100)
            : 0;

        // Prepare response
        res.status(200).json({
            success: true,
            data: {
                metrics: {
                    totalPatients,
                    returningPatients,
                    retentionRate,
                    averageVisits: totalPatients > 0
                        ? Math.round(results.reduce((sum, p) => sum + p.visitCount, 0) / totalPatients * 10) / 10
                        : 0
                },
                patientDetails: results
            },
            meta: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            }
        });
    } catch (err) {
        console.error('Patient retention error:', err);
        res.status(500).json({
            success: false,
            message: "Failed to generate patient retention report",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};