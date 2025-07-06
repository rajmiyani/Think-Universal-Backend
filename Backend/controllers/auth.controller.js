import bcrypt from 'bcryptjs';
import doctorModel from '../models/doctor.model.js';
import generateToken from '../utils/generateToken.js';

export const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if email & password provided
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required." });
        }

        // 2. Check if doctor exists
        const doctor = await doctorModel.findOne({ email }).select('+password');
        if (!doctor) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        // 3. Verify password
        // const isPasswordValid = await bcrypt.compare(password, doctor.password);
const isPasswordValid = await bcrypt.compare(password.trim(), doctor.password.trim());

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        // 4. Generate JWT token
        const token = generateToken(doctor._id, doctor.email, 'doctor'); // assuming you're passing role too

        // 5. Remove sensitive data before sending response
        const { password: pwd, ...doctorData } = doctor._doc;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            doctor: doctorData,
        });

    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({
            success: false,
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