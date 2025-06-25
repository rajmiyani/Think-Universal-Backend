import express from 'express';
import {
    getDashboardSummary,
    getRevenueTrends,
    getTodayPatients,
} from '../controllers/dashboard.controller.js';

const router = express.Router();

// Dashboard summary for current month
router.get('/summary',  getDashboardSummary);

// Revenue trends (yearly, monthly, weekly) with optional date range
router.get('/revenue-trends', getRevenueTrends);

// Today's patients with optional filters
router.get('/todayPatients', getTodayPatients);

export default router;