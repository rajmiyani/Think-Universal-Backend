import express from 'express';
import {
  getAppointments,
  exportCSV,
} from '../controllers/appointment.controller.js';

import { verifyToken, authorizeRoles } from '../middleware/admin.middlware.js';

const router = express.Router();

router.get("/getAppointments", verifyToken, getAppointments); // For admin panel
router.get("/export/csv", exportCSV);

export default router;