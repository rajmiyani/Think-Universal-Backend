import bcrypt from 'bcryptjs';
import authModel from '../models/auth.model.js';
import generateToken from '../utils/generateToken.js';
import axios from 'axios';
import { loginSchema } from '../validations/validationSchema.js'
import sendOTPEmail from '../utils/sendOTP.js';
const otpStore = new Map(); // Temporary OTP memory store


// 🔐 DOCTOR CREDENTIALS

const STATIC_EMAIL = "thinkuniversal@gmail.com";
const STATIC_PASSWORD = "Doctor@123";

export const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email, password, and role are required" });
        }


        const doctor = await authModel.findOne({ email }).select('+password');
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found for this role" });
        }

        const token = generateToken(doctor._id.toString(), doctor.email);

        return res.status(200).json({
            token,
            doctor
        });

    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({
            message: "Internal server error",
            error: err.message
        });
    }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
    }

    const user = await authModel.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    const result = await sendOTPEmail(email);
    if (!result.success) {
        return res.status(500).json({ message: 'Failed to send OTP', error: result.error });
    }

    // ✅ Store OTP
    otpStore.set(email, {
        otp: String(result.otp), // store as string
        expiresAt: Date.now() + 10 * 60 * 1000,
    });

    console.log("OTP Stored:", otpStore.get(email));

    return res.status(200).json({ message: 'OTP sent to your email' });
};

// Verify Otp
export const verifyOTP = (req, res) => {
    const { email, otp } = req.body;
    const data = otpStore.get(email);

    if (!data) return res.status(400).json({ message: 'No OTP sent to this email' });
    if (Date.now() > data.expiresAt)
        return res.status(400).json({ message: 'OTP expired' });
    if (data.otp !== parseInt(otp))
        return res.status(400).json({ message: 'Invalid OTP' });

    otpStore.delete(email);
    return res.status(200).json({ message: 'OTP verified, you can now reset your password' });
};

// Update Password
export const updatePassword = async (req, res) => {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check OTP format
    if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({ message: 'Invalid OTP format' });
    }

    // Check password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
        });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    const data = otpStore.get(email);
    console.log("OTP Data:", data);

    // ✅ Compare OTP properly
    if (!data || Date.now() > data.expiresAt || String(data.otp) !== String(otp)) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const doctor = await authModel.findOne({ email });
    if (!doctor) {
        return res.status(404).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    doctor.password = hashedPassword;
    await doctor.save();

    otpStore.delete(email); // ✅ clear OTP

    return res.status(200).json({ message: 'Password updated successfully' });
};