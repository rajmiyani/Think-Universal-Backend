import Doctor from '../models/doctor.model.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import multer from 'multer';
import { doctorSchema, updateDoctorSchema } from '../validations/validationSchema.js'

export const addDoctor = async (req, res) => {
    try {
        console.log("📥 Incoming Body:", req.body);
        console.log("🖼 Incoming File:", req.file);

        if (!req.body) {
            return res.status(400).json({ success: false, message: "Request body missing" });
        }

        // ✅ Parse form-data values
        const parsedBody = { ...req.body };

        if (parsedBody.bankDetails && typeof parsedBody.bankDetails === "string") {
            parsedBody.bankDetails = JSON.parse(parsedBody.bankDetails);
        }

        // ✅ Validate using Joi schema
        const { error, value } = doctorSchema.validate(parsedBody, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map((e) => e.message).join(", ");
            return res.status(400).json({ success: false, message: errorMessages });
        }

        // ✅ Check for existing email
        const isEmailExist = await Doctor.findOne({ email: value.email });
        if (isEmailExist) {
            return res.status(409).json({ success: false, message: "Email already exists" });
        }

        // ✅ Hash the password
        const hashedPassword = await bcrypt.hash(value.password, 10);

        // ✅ Create new doctor
        const doctor = new Doctor({
            ...value,
            password: hashedPassword,
            addedBy: req.user?.id || null
        });

        // ✅ Store avatar if available
        if (req.file) {
            doctor.avatar = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            };
        }

        // ✅ Save to DB
        const savedDoctor = await doctor.save();

        return res.status(201).json({
            success: true,
            message: "Doctor registered successfully",
            data: savedDoctor,
        });

    } catch (err) {
        console.error("❌ Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message,
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
        const { id: requesterId, role: requesterRole } = req.user;
        const doctorId = req.params.id || requesterId;

        // 🔍 Find the doctor to update
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        // 🛡 Access control logic
        const isSelf = doctor._id.toString() === requesterId;
        const isAddedBy = doctor.addedBy?.toString() === requesterId;
        const isMain = requesterRole === "main";

        if (!isSelf && !(isMain && isAddedBy)) {
            return res.status(403).json({ success: false, message: "Access denied. You are not authorized to update this profile." });
        }

        // ✅ Parse request body (bankDetails from form-data)
        const parsedBody = { ...req.body };
        if (parsedBody.bankDetails && typeof parsedBody.bankDetails === "string") {
            parsedBody.bankDetails = JSON.parse(parsedBody.bankDetails);
        }

        // ✅ Validate using Joi
        const { error, value } = updateDoctorSchema.validate(parsedBody, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.details.map(e => e.message)
            });
        }

        // 🛡 Email & Phone duplication checks
        if (value.email && value.email !== doctor.email) {
            const exists = await Doctor.findOne({ email: value.email, _id: { $ne: doctor._id } });
            if (exists) return res.status(409).json({ success: false, message: "Email already in use" });
        }

        if (value.phoneNo && value.phoneNo !== doctor.phoneNo) {
            const exists = await Doctor.findOne({ phoneNo: value.phoneNo, _id: { $ne: doctor._id } });
            if (exists) return res.status(409).json({ success: false, message: "Phone number already in use" });
        }

        // 🖼 Handle avatar image upload
        if (req.file) {
            value.avatar = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        // 🔁 Update doctor document
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