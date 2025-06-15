import express from 'express';
import {
    getDashboardData,
    getTodaysAppointment,
    getTodayPatients

} from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/dashboard', getDashboardData);
router.get('/todayAppointment',  getTodaysAppointment );
router.get("/todayPatients", getTodayPatients);

export default router;