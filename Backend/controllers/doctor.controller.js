import Doctor from '../models/doctor.model.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import multer from 'multer';
import { doctorSchema, updateDoctorSchema } from '../validations/validationSchema.js'

export const addDoctor = async (req, res) => {
    try {
        console.log("🧾 Body Data:", req.body);
        console.log("🖼️ File Data:", req.file);
        const { role, id: addedById } = req.user;

        if (role !== "main") {
            return res.status(403).json({ success: false, message: "Only main doctors can add sub doctors" });
        }

        const { error, value } = doctorSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map(d => d.message).join(', ');
            return res.status(400).json({ success: false, message: errorMessages });
        }

        const existing = await Doctor.findOne({ email: value.email });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        value.password = await bcrypt.hash(value.password, salt);

        if (req.file) {
            value.avatar = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
                originalName: req.file.originalname
            };
        }

        // value.addedBy = addedById; // Track who added this doctor
        value.role = 'Sub Doctor'; // Ensure the added doctor is not admin

        const doctor = await Doctor.create(value);
        const doctorObj = doctor.toObject();
        delete doctorObj.password;

        return res.status(201).json({
            success: true,
            message: "Doctor added successfully",
            doctor: {
                _id: doctor._id,
                ...doctorObj
            }
        });
    } catch (err) {
        console.error("Add Doctor Error:", err);
        return res.status(500).json({
            success: false, message: "Server error", error: err.message
        });
    }
};

export const allDoctor = async (req, res) => {
    try {
        const doctors = await Doctor.find().select('-password'); // Exclude password for security

        return res.status(200).json({
            success: true,
            message: "Doctors fetched successfully",
            data: doctors
        });
    } catch (err) {
        console.error("All Doctor Error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
};



export const updateDoctorProfile = async (req, res) => {
    try {
        const { id, email, role } = req.user;

        // 🔍 Match with correct role title in DB
        const doctor = await Doctor.findOne({
            _id: id,
            email,
            role: role === "main" ? "Main Doctor" : "Sub Doctor"
        });

        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found in database" });
        }

        // ✅ Validate body
        const { error, value } = updateDoctorSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.details.map(e => e.message)
            });
        }

        // 🛡 Check for duplicate email
        if (value.email && value.email !== doctor.email) {
            const exists = await Doctor.findOne({ email: value.email, _id: { $ne: doctor._id } });
            if (exists) {
                return res.status(409).json({ success: false, message: "Email already in use" });
            }
        }

        // 🛡 Check for duplicate phone
        if (value.phoneNo && value.phoneNo !== doctor.phoneNo) {
            const exists = await Doctor.findOne({ phoneNo: value.phoneNo, _id: { $ne: doctor._id } });
            if (exists) {
                return res.status(409).json({ success: false, message: "Phone number already in use" });
            }
        }

        // 📦 Handle avatar
        if (req.file) {
            value.avatar = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        // 🛠 Update
        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctor._id,
            { $set: value },
            { new: true, runValidators: true, context: 'query' }
        ).select("-password -__v");

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            doctor: updatedDoctor
        });

    } catch (err) {
        console.error("❌ Update Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};