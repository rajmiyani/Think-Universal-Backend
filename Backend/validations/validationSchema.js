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


export const appointmentSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            "string.base": "Name must be a string.",
            "string.empty": "Name is required.",
            "string.min": "Name must be at least 2 characters.",
            "string.max": "Name cannot exceed 50 characters.",
            "any.required": "Name is required."
        }),
    date: Joi.date()
        .iso()
        .min('now')
        .required()
        .messages({
            "date.base": "Date must be a valid ISO date.",
            "date.format": "Date must be in ISO format.",
            "date.min": "Date cannot be in the past.",
            "any.required": "Date is required."
        }),
    time: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .required()
        .messages({
            "string.pattern.base": "Time must be in HH:MM 24-hour format.",
            "any.required": "Time is required."
        }),
    age: Joi.number()
        .min(0)
        .max(120)
        .required()
        .messages({
            "number.base": "Age must be a number.",
            "number.min": "Age cannot be negative.",
            "number.max": "Age cannot exceed 120.",
            "any.required": "Age is required."
        }),
    doctor: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.base": "Doctor ID must be a string.",
            "string.hex": "Doctor ID must be a valid ObjectId.",
            "string.length": "Doctor ID must be 24 characters.",
            "any.required": "Doctor ID is required."
        }),
    meetingMode: Joi.string()
        .valid('Online', 'Offline')
        .required()
        .messages({
            "any.only": "Meeting mode must be either 'Online' or 'Offline'.",
            "any.required": "Meeting mode is required."
        }),
    paymentMethod: Joi.string()
        .valid('Cash', 'Card', 'UPI')
        .required()
        .messages({
            "any.only": "Payment method must be 'Cash', 'Card', or 'UPI'.",
            "any.required": "Payment method is required."
        }),
    status: Joi.string()
        .valid('pending', 'confirmed', 'cancelled')
        .default('pending')
        .messages({
            "any.only": "Status must be 'pending', 'confirmed', or 'cancelled'."
        })
})
    .custom((value, helpers) => {
        // Logical validation: appointment time cannot be in the past if date is today
        if (value.date) {
            const apptDate = new Date(value.date);
            const today = new Date();
            if (
                apptDate.toISOString().slice(0, 10) === today.toISOString().slice(0, 10) &&
                value.time
            ) {
                const [apptHour, apptMin] = value.time.split(':').map(Number);
                const nowHour = today.getHours();
                const nowMin = today.getMinutes();
                if (apptHour < nowHour || (apptHour === nowHour && apptMin <= nowMin)) {
                    return helpers.message('Appointment time must be in the future.');
                }
            }
        }
        return value;
    });