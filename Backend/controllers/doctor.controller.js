import Doctor from '../models/doctor.model.js';
import bcrypt from 'bcryptjs';
import { doctorSchema, updateDoctorSchema } from '../validations/validationSchema.js'

export const addDoctor = async (req, res) => {
    try {
        // 📦 Multer handles body + file separately
        console.log("🧾 Body Data:", req.body);
        console.log("🖼️ File Data:", req.file);

        if (!req.body) {
            return res.status(400).json({ success: false, message: "Request body is missing" });
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

        // 👇 If file is uploaded, store buffer and metadata
        if (req.file) {
            value.img = {
                data: req.file.buffer, // 🟢 Store buffer
                contentType: req.file.mimetype,
                originalName: req.file.originalname
            };
        }

        const doctor = await Doctor.create(value);
        const doctorObj = doctor.toObject();
        delete doctorObj.password;

        // ✅ Explicitly include _id in the response
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
            success: false, message: "Server error", error: err.message, stack: err.stack
        });

    }
};

export const allDoctor = async (req, res) => {
    try {
        const data = await Doctor.find();
        return res.status(201).json({
            success: true,
            message: "Doctor find",
            data
        });
    } catch (err) {
        console.error("Add Doctor Error:", err);
        return res.status(500).json({
            success: false, message: "Server error", error: err.message, stack: err.stack
        });

    }
};


export const updateDoctorProfile = async (req, res) => {
    try {
        // Debug: Log incoming request body and file (optional, remove in production)
        // console.log('Body:', req.body);
        // console.log('File:', req.file);

        // 1. Validate form fields using Joi
        const { error, value } = updateDoctorSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map(e => e.message);
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        // 2. Validate doctor ID from auth middleware
        const doctorId = req.user?._id;
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ success: false, message: 'Invalid doctor ID' });
        }

        // 3. Check if email is already used by another doctor
        if (value.email) {
            const existingDoctor = await Doctor.findOne({ email: value.email, _id: { $ne: doctorId } });
            if (existingDoctor) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already in use by another doctor'
                });
            }
        }

        // 4. Prepare update data
        const updatedData = { ...value };

        // 5. Handle avatar upload (store as Buffer)
        if (req.file) {
            updatedData.avatar = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        // 6. Update doctor in DB with Mongoose schema validation
        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            { $set: updatedData },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        ).select('-password -__v'); // Never return password or __v

        if (!updatedDoctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        // 7. Success response
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            doctor: updatedDoctor
        });
    } catch (err) {
        console.error('❌ Profile update error:', err);

        // Handle duplicate key error (e.g., email)
        if (err.code === 11000 && err.keyPattern?.email) {
            return res.status(409).json({
                success: false,
                message: 'Email already in use by another doctor'
            });
        }

        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // General server error
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};