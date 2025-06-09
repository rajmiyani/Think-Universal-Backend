import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        console.log("authHeader", authHeader);
        

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Token required" });
        }

        const token = authHeader.split(" ")[1];
        console.log("Token", token);
        
        const decoded = jwt.verify(token, process.env.DOCTOR_LOGIN_TOKEN);
        console.log("Decoded", decoded);
        

        // ✅ Just attach decoded info directly (no DB check)
        req.user = {
            id: decoded.id,
            role: decoded.role
        };
        console.log("✅ [verifyToken] User role:", req.user.role);
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
