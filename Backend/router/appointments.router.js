import express from 'express';
import {
  getAppointments,
  setAppointments,
  exportCSV,
} from '../controllers/appointment.controller.js';

import { verifyToken, authorizeRoles } from '../middleware/admin.middlware.js';

const router = express.Router();

router.post("/setAppointments", verifyToken, setAppointments); // For admin panel
router.get("/getAppointments", verifyToken, getAppointments); // For admin panel
router.get("/export/csv", exportCSV);

export default router;