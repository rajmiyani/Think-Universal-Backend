// utils/validate.js
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        try {
            const input = req[property];

            console.log(`🔍 Validating ${property}:`, input);

            if (!input || typeof input !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: `Missing or invalid ${property} in request`
                });
            }

            const { error, value } = schema.validate(input, {
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                console.error("❌ Validation failed:", error.details);
                const errors = error.details.map(err => err.message);
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors
                });
            }

            // ✅ SAFE ASSIGNMENT
            if (property === 'query') {
                req.validatedQuery = value;
            } else {
                req[property] = value;
            }

            console.log(`✅ ${property} validated and sanitized`);
            next();
        } catch (err) {
            console.error("🔥 Middleware validation error:", err);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error in validation middleware",
                error: err.message
            });
        }
    };
};

export default validate;
