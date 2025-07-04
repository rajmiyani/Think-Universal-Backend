// -------------------- Import Core Modules --------------------
import express from 'express';
import path, { join } from 'path';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import flash from 'express-flash';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

// -------------------- App Initialization --------------------
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// -------------------- MongoDB Connection --------------------
import './config/mongoose.js';

// -------------------- Middleware --------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'developer',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));
app.use(flash());
app.use(morgan('dev'));
app.use(express.static('public'));

// -------------------- Static Files --------------------
app.use(express.static(join(__dirname, 'public')));
app.use('/uploads', express.static(join(__dirname, 'uploads'))); // ✅ Serve uploaded files

// -------------------- Routes --------------------
import authRoutes from './router/auth.router.js';
import doctorRoutes from './router/doctor.router.js';
import availabilityRoutes from './router/availability.router.js';
import patientRoutes from './router/patient.router.js';
import appointmentRoutes from './router/appointments.router.js';
import reportsRoutes from './router/report.router.js';
import prescriptionReports from './router/prescription.router.js';
import dashboardReports from './router/dashboard.router.js';
import modesRoutes from './router/mode.router.js';
import withdrawRoutes from './router/withdraw.routes.js';

app.use('/auths', authRoutes);
app.use('/doctors', doctorRoutes);
app.use('/availability', availabilityRoutes);
app.use('/patients', patientRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/reports', reportsRoutes);
app.use('/prescriptions', prescriptionReports);
app.use('/dashboard', dashboardReports);
app.use('/mode', modesRoutes);
app.use('/withdraw', withdrawRoutes);

// -------------------- Fallback Route --------------------
// app.use('*', (req, res) => {
//     res.status(404).json({ message: '🔍 Route not found' });
// });

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`✅ Server is running on https://thinkuniversal.onrender.com:${PORT}`);
});

server.on('error', (err) => {
    console.error('❌ Server failed to start:', err);
});

