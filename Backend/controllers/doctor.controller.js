import Doctor from '../models/doctor.model.js';
import bcrypt from 'bcryptjs';
import { doctorSchema } from '../validations/validationSchema.js'

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
        return res.status(500).json({ success: false, message: "Server error" });
    }
};