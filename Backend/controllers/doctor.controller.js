import Doctor from '../models/doctor.model.js';
import bcrypt from 'bcryptjs';
import { doctorSchema } from '../validations/validationSchema.js'


// Add Doctor
// export const addDoctor = async (req, res) => {
//     try {
//         // Validate input
//         const { error, value } = doctorSchema.validate(req.body, { abortEarly: false });
//         if (error) {
//             const errorMessages = error.details.map(d => d.message).join(', ');
//             return res.status(400).json({ success: false, message: errorMessages });
//         }

//         // Check if email exists
//         const existing = await Doctor.findOne({ email: value.email });
//         console.log("Existing", existing);

//         if (existing) {
//             return res.status(409).json({ success: false, message: 'Email already exists' });
//         }

//         // Hash the password
//         const salt = await bcrypt.genSalt(10);
//         console.log("Salt", salt);

//         value.password = await bcrypt.hash(value.password, salt);

//         // Create doctor
//         const doctor = await Doctor.create(value);
//         console.log("Doctor", doctor);

//         const doctorObj = doctor.toObject();
//         delete doctorObj.password;

//         return res.status(201).json({ success: true, message: "Doctor added successfully", doctor: doctorObj });
//     } catch (err) {
//         console.error("Add Doctor Error:", err);
//         return res.status(500).json({ success: false, message: "Server error" });
//     }
// };

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

        // 👇 Add image path if file uploaded
        if (req.file) {
            value.img = `/uploads/${req.file.filename}`;
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

export const getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find().select('-password');
        res.json({ success: true, doctors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).select('-password');
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
        res.json({ success: true, doctor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateDoctor = async (req, res) => {
    try {
        // Only allow certain fields to be updated
        const allowedFields = ['name', 'specialization', 'phone', 'bankDetails'];
        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        });

        // Optionally validate bankDetails if present
        if (updateData.bankDetails) {
            const { error } = bankDetailsSchema.validate(updateData.bankDetails, { abortEarly: false });
            if (error) {
                return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(', ') });
            }
        }

        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true, context: 'query' }
        ).select('-password');
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

        res.json({ success: true, doctor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
        res.json({ success: true, message: 'Doctor deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addBankDetails = async (req, res) => {
    try {
        const { error } = bankDetailsSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(', ') });
        }

        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            { bankDetails: req.body },
            { new: true, runValidators: true, context: 'query' }
        ).select('-password');
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

        res.json({ success: true, doctor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};