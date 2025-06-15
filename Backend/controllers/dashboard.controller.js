import Dashboard from '../models/dashboard.model.js';
import moment from 'moment';
import { dashboardQuerySchema, todayPatientsQuerySchema } from '../validations/validationSchema.js'

// 🔹 Get dashboard data (summary + graphs)
export const getDashboardData = async (req, res) => {
    try {
        // Validate query
        const { error, value } = dashboardQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details.map(e => e.message)
            });
        }

        const { year, month } = value;
        const startDate = moment(`${year}-${month}-01`).startOf('month').toDate();
        const endDate = moment(startDate).endOf('month').toDate();

        const dashboard = await Dashboard.find({
            date: { $gte: startDate, $lte: endDate }
        });

        const stats = {
            completed: dashboard.filter(a => a.status === 'Completed').length,
            upcoming: dashboard.filter(a => a.status === 'Upcoming').length,
            cancelled: dashboard.filter(a => a.status === 'Cancelled').length,
            revenue: dashboard.reduce((acc, cur) => acc + (cur.revenue || 0), 0),
        };

        res.json({ success: true, stats, dashboard });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Dashboard data fetch error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// 🔹 Get distinct years/months for dropdown filters
export const getAvailableYearsMonths = async (req, res) => {
    try {
        const allDates = await Dashboard.find({}, { date: 1, _id: 0 });

        const years = [...new Set(allDates.map(item => new Date(item.date).getFullYear()))].sort((a, b) => b - a);
        const months = [...new Set(allDates.map(item => new Date(item.date).getMonth() + 1))].sort((a, b) => a - b);

        res.json({ success: true, years, months });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to load filter data',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// 🔹 Get today’s dashboard data
export const getTodaysAppointment = async (req, res) => {
    try {
        const start = moment().startOf('day').toDate();
        const end = moment().endOf('day').toDate();

        const todays = await Dashboard.find({ date: { $gte: start, $lte: end } }).sort({ date: 1 });

        res.json({ success: true, data: todays });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching today’s dashboard data',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

export const getTodayPatients = async (req, res) => {
    try {
        // Validate query parameters
        const { error, value } = todayPatientsQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details.map(e => e.message)
            });
        }

        const startOfDay = moment().startOf("day").toDate();
        const endOfDay = moment().endOf("day").toDate();

        // Build query with optional filters
        const query = {
            date: { $gte: startOfDay, $lte: endOfDay }
        };
        if (value.doctorName) query.doctorName = value.doctorName;
        if (value.status) query.status = value.status;

        const patients = await Dashboard.find(query)
            .select("patientName doctorName date status")
            .sort({ date: 1 });

        const formatted = patients.map(p => ({
            patientName: p.patientName,
            doctorName: p.doctorName,
            time: moment(p.date).format("hh:mm A"),
            status: p.status
        }));

        res.status(200).json({
            success: true,
            data: formatted
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
