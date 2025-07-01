import jwt from 'jsonwebtoken';
import Doctor from '../models/doctor.model.js'; // or whatever your user model is

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Bearer token

        if (!token) {
            return res.status(401).json({ success: false, message: "Access Denied. No token provided." });
        }

        const decoded = jwt.verify(token, process.env.DOCTOR_LOGIN_TOKEN); // Make sure this is the same secret used during login

        // ✅ Fetch user info from DB (optional)
        const doctor = await Doctor.findById(decoded.id);

        if (!doctor) {
            return res.status(401).json({ success: false, message: "Invalid token or user not found" });
        }

        // ✅ Attach to req.user
        req.user = {
            id: doctor._id,
            name: `${doctor.firstName} ${doctor.lastName}` // or however your model stores name
        };

        next();

    } catch (err) {
        console.error("❌ Auth Error:", err);
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

export default authMiddleware;