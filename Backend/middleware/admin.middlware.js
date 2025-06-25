import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Token required in format: Bearer <token>" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.DOCTOR_LOGIN_TOKEN);

        if (!decoded?.id || !decoded?.role || !decoded?.email) {
            return res.status(401).json({ message: "Token is invalid: Missing id or role" });
        }

        req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email, // ✅ add this
        };

        next();
    } catch (error) {
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
