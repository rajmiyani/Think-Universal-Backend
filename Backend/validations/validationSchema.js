import Joi from "joi";
import mongoose from 'mongoose';


// --- Validation Schemas ---

export const doctorSchema = Joi.object({
    firstName: Joi.string()
        .min(2)
        .max(15)
        .required(),
    lastName: Joi.string()
        .min(2)
        .max(15)
        .required(),
    email: Joi.string()
        .email()
        .required(),
    phoneNo: Joi.string()
        .pattern(/^\d{10,15}$/)
        .required()
        .messages({
            'string.pattern.base': 'Phone number must be 10 to 15 digits'
        }),
    destination: Joi.string()
        .min(2)
        .max(50)
        .required(),
    totalPatient: Joi.number()
        .min(0)
        .default(0),
    experience: Joi.number()
        .min(0)
        .max(80)
        .required(),
    rating: Joi.number()
        .min(0)
        .max(5)
        .default(0),
    gender: Joi.string()
        .valid('Male', 'Female', 'Other')
        .required(),
    review: Joi.string()
        .max(1000)
        .allow(''),
    img: Joi.string()
        .allow('', null),
    about: Joi.string()
        .max(2000)
        .allow(''),
    password: Joi.string()
        .min(6)
        .required(),
    addedBy: Joi.string()
        .optional()
        .allow(null, ''),
    bankDetails: Joi.object({
        accountNumber: Joi.string()
            .pattern(/^\d{9,18}$/)
            .required()
            .messages({
                'string.pattern.base': 'Account number must be 9 to 18 digits'
            }),
        ifscCode: Joi.string()
            .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid IFSC code format'
            }),
        bankName: Joi.string()
            .min(2)
            .max(100)
            .required(),
        upiId: Joi.string()
            .pattern(/^[\w.-]+@[\w.-]+$/)
            .optional()
            .allow('', null)
            .messages({
                'string.pattern.base': 'Invalid UPI ID format'
            })
    }).optional(),

    role: Joi.string()
        .valid('doctor', 'admin')
        .default('doctor')
});

export const bankDetailsSchema = Joi.object({
    accountNumber: Joi.string().pattern(/^\d{9,18}$/).required(),
    ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
    bankName: Joi.string().min(2).max(100).required(),
    upiId: Joi.string().pattern(/^[\w.-]+@[\w.-]+$/).optional().allow(''),
});

export const loginSchema = Joi.object({
    doctor_info: Joi.string().required(),
    doctor_pass: Joi.string().required(),
    // captchaToken: Joi.string().required() // Uncomment if using captcha
});



// Availability Slot Validation Schema
export const availabilitySchema = Joi.object({
    firstName: Joi.string()
        .min(2)
        .max(15)
        .required(),
    lastName: Joi.string()
        .min(2)
        .max(15)
        .required(),
    date: Joi.date()
        .iso() // expects YYYY-MM-DD or full ISO
        .min('now')
        .required()
        .messages({
            "date.base": "Date must be in ISO format.",
            "date.format": "Date must be in YYYY-MM-DD format.",
            "date.min": "Date must be today or in the future.",
            "any.required": "Date is required."
        }),

    fromTime: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .required()
        .messages({
            "string.pattern.base": "From time must be in HH:MM 24-hour format.",
            "any.required": "From time is required."
        }),

    toTime: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .required()
        .messages({
            "string.pattern.base": "To time must be in HH:MM 24-hour format.",
            "any.required": "To time is required."
        }),

    isMonthly: Joi.boolean().default(false)
})
    .custom((value, helpers) => {
        // Logical: toTime must be after fromTime
        if (value.fromTime && value.toTime) {
            const [fromH, fromM] = value.fromTime.split(':').map(Number);
            const [toH, toM] = value.toTime.split(':').map(Number);

            const fromMinutes = fromH * 60 + fromM;
            const toMinutes = toH * 60 + toM;

            if (toMinutes <= fromMinutes) {
                return helpers.message('To time must be after from time.');
            }
        }

        return value;
    });
