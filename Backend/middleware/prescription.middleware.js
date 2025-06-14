import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.DOCTOR_LOGIN_TOKEN);
        req.user = decoded; // attach entire user info from token
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

export default authMiddleware;
