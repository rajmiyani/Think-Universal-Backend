import express from 'express';
import {
    getDashboardSummary,
    getWeeklyRevenueTrend,
    getRevenueTrends,
    getTodayPatients,
    getDoctorPerformance,
    getAppointmentTypeAnalysis,
    getPatientRetention
} from '../controllers/dashboard.controller.js';

import { verifyToken } from '../middleware/admin.middlware.js';

const router = express.Router();

// Dashboard summary for current month
router.get('/summary', verifyToken, getDashboardSummary);

// Weekly revenue trend (current week)
router.get('/weekly-trend', verifyToken, getWeeklyRevenueTrend);

// Revenue trends (yearly, monthly, weekly) with optional date range
router.get('/revenue-trends', verifyToken, getRevenueTrends);

// Today's patients with optional filters
router.get('/today-patients', verifyToken, getTodayPatients);

// Doctor performance metrics
router.get('/doctor-performance', verifyToken, getDoctorPerformance);

// Appointment type analysis
router.get('/appointment-type-analysis', verifyToken, getAppointmentTypeAnalysis);

// Patient retention metrics
router.get('/patient-retention', verifyToken, getPatientRetention);

export default router;