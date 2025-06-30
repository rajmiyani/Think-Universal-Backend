import express from 'express';
import {
    getDashboardSummary,
    getRevenueTrends,
    getTodayAppointment,
    getTodayPatients,
} from '../controllers/dashboard.controller.js';

const router = express.Router();

// Graph
router.get('/summary',  getDashboardSummary);

// Revenue
router.get('/revenue-trends', getRevenueTrends);

// Today's patients with filltter
router.get('/todayPatients', getTodayPatients);

// Appointment's patients with filltter
router.get('/todayAppointment', getTodayAppointment);

export default router;