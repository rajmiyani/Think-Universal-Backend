import Doctor from '../models/doctor.model.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import multer from 'multer';
import { doctorSchema, updateDoctorSchema } from '../validations/validationSchema.js'
import doctorModel from '../models/doctor.model.js';

export const addDoctor = async (req, res) => {
    try {
        console.log("📥 Incoming Body:", req.body);
        console.log("🖼 Incoming File:", req.file);

        if (!req.body) {
            return res.status(400).json({ success: false, message: "Request body missing" });
        }

        const parsedBody = { ...req.body };

        if (parsedBody.bankDetails && typeof parsedBody.bankDetails === "string") {
            parsedBody.bankDetails = JSON.parse(parsedBody.bankDetails);
        }

        const { error, value } = doctorSchema.validate(parsedBody, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map((e) => e.message).join(", ");
            return res.status(400).json({ success: false, message: errorMessages });
        }

        const isEmailExist = await Doctor.findOne({ email: value.email });
        if (isEmailExist) {
            return res.status(409).json({ success: false, message: "Email already exists" });
        }


        const doctor = new Doctor({
            ...value, // includes fields from validated request body
            addedBy: req.user?.id || null,
            role: req.user?.role === 'main' && value.role === 'main' ? 'main' : 'sub'  // 🛡️ only allow 'main' if added by a main
        });


        if (req.file) {
            doctor.avatar = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

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


// export const updateDoctorProfile = async (req, res) => {
//     try {
//         const { id: requesterId } = req.user;

//         console.log("🔐 Authenticated User:", req.user);

//         if (!mongoose.Types.ObjectId.isValid(requesterId)) {
//             return res.status(400).json({ success: false, message: "Invalid doctor ID" });
//         }

//         // Use doctorModel from adminDB
//         const doctor = await doctorModel.findById(requesterId);
//         if (!doctor) {
//             return res.status(404).json({ success: false, message: "Doctor not found" });
//         }

//         const parsedBody = { ...req.body };
//         if (parsedBody.bankDetails && typeof parsedBody.bankDetails === "string") {
//             parsedBody.bankDetails = JSON.parse(parsedBody.bankDetails);
//         }

//         const { error, value } = updateDoctorSchema.validate(parsedBody, { abortEarly: false });
//         if (error) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Validation failed",
//                 errors: error.details.map(e => e.message)
//             });
//         }

//         // Email and phone checks
//         if (value.email && value.email !== doctor.email) {
//             const emailExists = await doctorModel.findOne({ email: value.email, _id: { $ne: doctor._id } });
//             if (emailExists) {
//                 return res.status(409).json({ success: false, message: "Email already in use" });
//             }
//         }

//         if (value.phoneNo && value.phoneNo !== doctor.phoneNo) {
//             const phoneExists = await doctorModel.findOne({ phoneNo: value.phoneNo, _id: { $ne: doctor._id } });
//             if (phoneExists) {
//                 return res.status(409).json({ success: false, message: "Phone number already in use" });
//             }
//         }

//         if (req.file) {
//             value.avatar = {
//                 data: req.file.buffer,
//                 contentType: req.file.mimetype
//             };
//         }

//         const updatedDoctor = await doctorModel.findByIdAndUpdate(
//             requesterId,
//             { $set: value },
//             { new: true, runValidators: true, context: 'query' }
//         ).select('-password -__v');

//         return res.status(200).json({
//             success: true,
//             message: "Profile updated successfully",
//             doctor: updatedDoctor
//         });

//     } catch (err) {
//         console.error("❌ Update Error:", err);
//         return res.status(500).json({
//             success: false,
//             message: "Internal server error",
//             error: err.message
//         });
//     }
// };


// Temporly

export const updateDoctorProfile = async (req, res) => {
    try {
        const requesterId = req.params.id; // ⬅️ TEMPORARY: take from URL param

        console.log("🔐 Doctor ID (manual):", requesterId);

        if (!mongoose.Types.ObjectId.isValid(requesterId)) {
            return res.status(400).json({ success: false, message: "Invalid doctor ID" });
        }

        const doctor = await doctorModel.findById(requesterId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        const parsedBody = { ...req.body };
        if (parsedBody.bankDetails && typeof parsedBody.bankDetails === "string") {
            parsedBody.bankDetails = JSON.parse(parsedBody.bankDetails);
        }

        const { error, value } = updateDoctorSchema.validate(parsedBody, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.details.map(e => e.message),
            });
        }

        if (value.email && value.email !== doctor.email) {
            const emailExists = await doctorModel.findOne({ email: value.email, _id: { $ne: doctor._id } });
            if (emailExists) {
                return res.status(409).json({ success: false, message: "Email already in use" });
            }
        }

        if (value.phoneNo && value.phoneNo !== doctor.phoneNo) {
            const phoneExists = await doctorModel.findOne({ phoneNo: value.phoneNo, _id: { $ne: doctor._id } });
            if (phoneExists) {
                return res.status(409).json({ success: false, message: "Phone number already in use" });
            }
        }

        if (req.file) {
            value.avatar = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            };
        }

        const updatedDoctor = await doctorModel.findByIdAndUpdate(
            requesterId,
            { $set: value },
            { new: true, runValidators: true, context: "query" }
        ).select('-password -__v');

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            doctor: updatedDoctor,
        });
    } catch (err) {
        console.error("❌ Update Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message,
        });
    }
};
