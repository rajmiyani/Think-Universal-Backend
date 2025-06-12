const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,         // Return all errors, not just the first one
            stripUnknown: true         // Remove unknown keys
        });

        if (error) {
            const errors = error.details.map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        // Replace input with validated & sanitized data
        req[property] = value;

        next();
    };
};

export default validate;
