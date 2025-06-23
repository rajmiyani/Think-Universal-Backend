import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
    try {
        console.log("📥 [verifyToken] Incoming request");

        const authHeader = req.headers['authorization'];
        console.log("🔐 Authorization Header:", authHeader);

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Token required in format: Bearer <token>" });
        }

        const token = authHeader.split(" ")[1];
        console.log("🔑 Extracted Token:", token);

        if (!process.env.DOCTOR_LOGIN_TOKEN) {
            console.error("❌ JWT secret not configured in environment variables");
            return res.status(500).json({ message: "Server misconfiguration: Missing JWT secret" });
        }

        const decoded = jwt.verify(token, process.env.DOCTOR_LOGIN_TOKEN);
        console.log("✅ Decoded JWT Payload:", decoded);

        if (!decoded?.id || !decoded?.role) {
            console.error("❌ Invalid token payload");
            return res.status(401).json({ message: "Token is invalid: Missing id or role" });
        }

        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        console.log("🧑 Authenticated User ID:", req.user.id);
        console.log("🧑 User Role:", req.user.role);

        next();

    } catch (error) {
        console.error("❌ JWT Verification Error:", error.message);
        return res.status(401).json({ message: "Unauthorized: " + error.message });
    }
};



export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        console.log("🔍 Allowed roles:", allowedRoles);
        console.log("🔍 Current user role:", req.user?.role);

        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden - Insufficient privileges" });
        }
        next();
    };
};
