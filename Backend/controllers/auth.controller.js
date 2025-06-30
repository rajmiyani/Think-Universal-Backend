import bcrypt from 'bcryptjs';
import doctorModel from '../models/doctor.model.js';
import generateToken from '../utils/generateToken.js';

// ✅ DOCTOR LOGIN CONTROLLER
export const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const doctor = await doctorModel.findOne({ email }).select('+password');
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        const token = generateToken(doctor._id.toString(), doctor.email, doctor.role);

        return res.status(200).json({
            message: "Login successful",
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


export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
    }

    const user = await doctorModel.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    return res.status(200).json({ message: 'Email verified. You can now update your password.' });
};


export const updatePassword = async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            message: 'Password must be at least 6 characters and include uppercase, lowercase, and a number'
        });
    }

    const user = await doctorModel.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
};