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
    doctorId: Joi.string()
        .optional()
        .custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.message('Invalid doctor ID format');
            }
            return value;
        })
        .messages({
            'any.required': 'Doctor ID is required'
        }),
    firstName: Joi.string()
        .min(2)
        .max(15)
        .required().
        messages({
            'string.empty': 'First name is required'
        }),
    lastName: Joi.string()
        .min(2)
        .max(15)
        .required().messages({
            'string.empty': 'Last name is required'
        }),
    date: Joi.date()
        .iso()
        .min('now')
        .when('isMonthly', {
            is: true,
            then: Joi.optional(),
            otherwise: Joi.required()
        })
        .messages({
            'date.base': 'Invalid date format',
            'date.min': 'Date cannot be in the past',
            'any.required': 'Date is required'
        }),

    fromTime: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .when('isMonthly', {
            is: true,
            then: Joi.optional(),
            otherwise: Joi.required()
        })
        .messages({
            'string.pattern.base': 'Invalid time format (HH:mm)',
            'any.required': 'Start time is required'
        }),

    toTime: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .when('isMonthly', {
            is: true,
            then: Joi.optional(),
            otherwise: Joi.required()
        })
        .custom((value, helpers) => {
            const { fromTime } = helpers.state.ancestors[0];
            // Only check if both times are present
            if (value && fromTime && value <= fromTime) {
                return helpers.message('End time must be after start time');
            }
            return value;
        })
        .messages({
            'string.pattern.base': 'Invalid time format (HH:mm)',
            'any.required': 'End time is required'
        }),

    isMonthly: Joi.boolean()
        .default(false),

    // startMonth: Joi.string()
    //     .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
    //     .when('isMonthly', {
    //         is: true,
    //         then: Joi.required().messages({
    //             'any.required': 'startMonth is required when isMonthly is true',
    //             'string.pattern.base': 'startMonth must be in YYYY-MM format'
    //         }),
    //         otherwise: Joi.optional()
    //     }),

    endMonth: Joi.string()
        .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
        .when('isMonthly', {
            is: true,
            then: Joi.required().messages({
                'any.required': 'endMonth is required when isMonthly is true',
                'string.pattern.base': 'endMonth must be in YYYY-MM format'
            }),
            otherwise: Joi.optional()
        }),
    modes: Joi.object({
        audio: Joi.boolean()
            .required()
            .messages({
                'any.required': 'Audio mode is required',
                'boolean.base': 'Audio mode must be a boolean'
            }),
        chat: Joi.boolean()
            .required()
            .messages({
                'any.required': 'Chat mode is required',
                'boolean.base': 'Chat mode must be a boolean'
            }),
        videoCall: Joi.boolean()
            .required()
            .messages({
                'any.required': 'Video call mode is required',
                'boolean.base': 'Video call mode must be a boolean'
            })
    })
        .required()
        .messages({
            'any.required': 'Modes object is required'
        })
})
    .custom((value, helpers) => {
        // Only validate order if both months and isMonthly are present
        if (value.isMonthly && value.startMonth && value.endMonth) {
            if (value.endMonth < value.startMonth) {
                return helpers.error('any.invalid', { message: 'endMonth must be the same as or after startMonth' });
            }
        }
        return value;
    }, 'startMonth/endMonth order validation')
    .prefs({ abortEarly: false, stripUnknown: true });


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

export const validateQuery = (query) => {
    const schema = Joi.object({
        name: Joi.string()
            .trim()
            .allow('')
            .default(''),
        doctor: Joi.string()
            .trim()
            .allow('')
            .custom((value, helpers) => {
                if (value && !mongoose.Types.ObjectId.isValid(value)) {
                    return helpers.error('any.invalid', { message: 'Invalid doctor ID format' });
                }
                return value;
            }, 'ObjectId validation'),
        status: Joi.string()
            .valid('pending', 'confirmed', 'cancelled', 'all')
            .default('all'),
        page: Joi.number()
            .integer()
            .min(1)
            .default(1),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(5)
    });

    // Validate and sanitize the query, returning all errors if present
    return schema.validate(query, { abortEarly: false, stripUnknown: true });
};


export const patientSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters',
            'string.max': 'Name cannot exceed 100 characters'
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Invalid email format',
            'string.empty': 'Email is required'
        }),
    phone: Joi.string()
        .pattern(/^\d{10,15}$/)
        .required()
        .messages({
            'string.pattern.base': 'Phone must be 10-15 digits',
            'string.empty': 'Phone is required'
        }),
    gender: Joi.string()
        .valid('Male', 'Female', 'Other')
        .required()
        .messages({
            'any.only': 'Invalid gender selection'
        }),
    age: Joi.number()
        .integer()
        .min(20)
        .max(120)
        .required()
        .messages({
            'number.base': 'Age must be a number',
            'number.min': 'Age must be at least 20 Up',
            'number.max': 'Age cannot exceed 120',
            'any.required': 'Age is required'
        }),
    address: Joi.string()
        .min(3)
        .max(200)
        .required()
        .messages({
            'string.min': 'Address must be at least 3 characters',
            'string.max': 'Address cannot exceed 200 characters'
        })
}).options({ abortEarly: false });


export const reportFilterSchema = Joi.object({
    doctor: Joi.string()
        .min(3)
        .max(100)
        .pattern(/^[a-zA-Z0-9\s.'-]+$/)
        .optional()
        .messages({
            "string.min": "Doctor must be at least 3 characters.",
            "string.max": "Doctor cannot exceed 100 characters.",
            "string.pattern.base": "Doctor contains invalid characters."
        }),

    status: Joi.string()
        .valid('Completed', 'Cancelled', 'Upcoming')
        .optional()
        .messages({
            "any.only": "Status must be 'Completed', 'Cancelled', or 'Upcoming'."
        }),

    startDate: Joi.date()
        .iso()
        .optional()
        .allow(null, '')
        .messages({
            "date.base": "Start date must be a valid ISO date."
        }),

    endDate: Joi.date()
        .iso()
        .optional()
        .allow(null, '')
        .messages({
            "date.base": "End date must be a valid ISO date."
        }),

    page: Joi.number()
        .min(1)
        .default(1)
        .messages({
            "number.base": "Page must be a number.",
            "number.min": "Page must be at least 1."
        }),

    limit: Joi.number()
        .min(1)
        .max(100)
        .default(10)
        .messages({
            "number.base": "Limit must be a number.",
            "number.min": "Limit must be at least 1.",
            "number.max": "Limit cannot exceed 100."
        })
})
    // Require both startDate and endDate together
    .and('startDate', 'endDate')
    // Custom validation to ensure endDate > startDate
    .custom((value, helpers) => {
        const { startDate, endDate } = value;
        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
            return helpers.message('"End Date" must be greater than "Start Date"');
        }
        return value;
    });


export const reportUploadSchema = Joi.object({
    reportNote: Joi.string()
        .max(1000)
        .allow('', null) // Allow empty note
        .label('Doctor Note')
});

export const prescriptionSchema = Joi.object({
    // reportId: Joi.string()
    //     .custom((value, helpers) => {
    //         if (!mongoose.Types.ObjectId.isValid(value)) {
    //             return helpers.message('Invalid reportId format');
    //         }
    //         return value;
    //     }),
    prescriptionNote: Joi.string()
        .min(10)
        .max(2000)
        .required()
        .messages({
            'string.min': 'Prescription note must be at least 10 characters.',
            'string.max': 'Prescription note cannot exceed 2000 characters.',
            'any.required': 'Prescription note is required.'
        }),
    createdBy: Joi.string()
        .min(3)
        .max(100)
        .pattern(/^[a-zA-Z0-9\s.'-]+$/)
        .required()
        .messages({
            'string.min': 'Creator must be at least 3 characters.',
            'string.max': 'Creator cannot exceed 100 characters.',
            'string.pattern.base': 'Creator contains invalid characters.',
            'any.required': 'Creator is required.'
        })
});

// For validating route param `reportId`
export const getPrescriptionsParamSchema = Joi.object({
    reportId: Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.error("any.invalid");
        }
        return value;
    }, 'ObjectId Validation').required().label("Report ID")
});

export const getAllPrescriptionsQuerySchema = Joi.object({
    page: Joi.number().min(1).default(1)
        .messages({
            'number.base': 'Page must be a number.',
            'number.min': 'Page must be at least 1.'
        }),
    limit: Joi.number().min(1).max(100).default(10)
        .messages({
            'number.base': 'Limit must be a number.',
            'number.min': 'Limit must be at least 1.',
            'number.max': 'Limit cannot exceed 100.'
        }),
    search: Joi.string().optional()
});

export const dashboardQuerySchema = Joi.object({
    year: Joi.number()
        .integer()
        .min(2000)
        .max(new Date().getFullYear())
        .required()
        .messages({
            'number.base': 'Year must be a number.',
            'number.min': 'Year must be 2000 or later.',
            'number.max': 'Year cannot be in the future.',
            'any.required': 'Year is required.'
        }),
    month: Joi.number()
        .integer()
        .min(1)
        .max(12)
        .required()
        .messages({
            'number.base': 'Month must be a number.',
            'number.min': 'Month must be between 1 and 12.',
            'number.max': 'Month must be between 1 and 12.',
            'any.required': 'Month is required.'
        })
});

export const todayPatientsQuerySchema = Joi.object({
    doctorName: Joi.string()
        .min(3)
        .max(100)
        .pattern(/^[a-zA-Z0-9\s.'-]+$/)
        .optional()
        .messages({
            'string.min': 'Doctor name must be at least 3 characters.',
            'string.max': 'Doctor name cannot exceed 100 characters.',
            'string.pattern.base': 'Doctor name contains invalid characters.'
        }),
    status: Joi.string()
        .valid('Completed', 'Upcoming', 'Cancelled')
        .optional()
        .messages({
            'any.only': "Status must be 'Completed', 'Upcoming', or 'Cancelled'."
        })
});


export const modeValidationSchema = Joi.object({
    name: Joi.string()
        .valid('audio', 'video call', 'chat')
        .required()
        .messages({
            'any.required': 'Mode name is required',
            'any.only': 'Mode name must be one of: audio, video call, chat'
        }),
    currency: Joi.string()
        .valid('USD', 'INR')
        .required()
        .messages({
            'any.required': 'Currency is required',
            'any.only': 'Currency must be USD or INR'
        }),
    price: Joi.number()
        .precision(2)
        .min(0)
        .max(100000)
        .required()
        .messages({
            'number.base': 'Price must be a number',
            'number.min': 'Price cannot be negative',
            'number.max': 'Price is unrealistically high',
            'any.required': 'Price is required'
        }),
    isActive: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': 'isActive must be a boolean value'
        })
}).prefs({ abortEarly: false, stripUnknown: true });

export const updateDoctorSchema = Joi.object({
    firstName: Joi.string()
        .min(2)
        .max(15)
        .optional()
        .messages({
            'string.base': 'First name must be a string',
            'string.min': 'First name must be at least 2 characters',
            'string.max': 'First name cannot exceed 15 characters'
        }),

    lastName: Joi.string()
        .min(2)
        .max(15)
        .optional()
        .messages({
            'string.base': 'Last name must be a string',
            'string.min': 'Last name must be at least 2 characters',
            'string.max': 'Last name cannot exceed 15 characters'
        }),

    email: Joi.string()
        .email({ tlds: { allow: false } })
        .optional()
        .messages({
            'string.email': 'Please enter a valid email address'
        }),

    phoneNo: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Phone number must be 10-15 digits'
        }),

    speciality: Joi.string()
        .min(2)
        .max(50)
        .optional()
        .messages({
            'string.base': 'Speciality must be a string',
            'string.min': 'Speciality must be at least 2 characters',
            'string.max': 'Speciality must be at most 50 characters'
        }),

    degree: Joi.string()
        .min(2)
        .optional()
        .messages({
            'string.base': 'Degree must be a string',
            'string.min': 'Degree must be at least 2 characters'
        }),

    experience: Joi.alternatives().try(
        Joi.number().min(0).max(80),
        Joi.string().pattern(/^\d+$/)
    )
        .optional()
        .messages({
            'number.base': 'Experience must be a number',
            'number.min': 'Experience cannot be negative',
            'number.max': 'Experience cannot exceed 80 years',
            'string.pattern.base': 'Experience must be a valid number'
        }),

    clinicAddress: Joi.string()
        .min(5)
        .optional()
        .messages({
            'string.base': 'Clinic address must be a string',
            'string.min': 'Clinic address must be at least 5 characters'
        }),

    city: Joi.string()
        .min(2)
        .optional()
        .messages({
            'string.base': 'City must be a string',
            'string.min': 'City must be at least 2 characters'
        }),

    state: Joi.string()
        .min(2)
        .optional()
        .messages({
            'string.base': 'State must be a string',
            'string.min': 'State must be at least 2 characters'
        }),

    pincode: Joi.string()
        .pattern(/^[0-9]{6}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Pincode must be 6 digits'
        }),

    bio: Joi.string()
        .max(2000)
        .allow('', null)
        .optional()
        .messages({
            'string.base': 'Bio must be a string',
            'string.max': 'Bio cannot exceed 2000 characters'
        }),

    gender: Joi.string()
        .valid('Male', 'Female', 'Other')
        .optional()
        .messages({
            'any.only': 'Gender must be Male, Female, or Other'
        }),

    about: Joi.string()
        .max(2000)
        .allow('', null)
        .optional()
        .messages({
            'string.base': 'About must be a string',
            'string.max': 'About cannot exceed 2000 characters'
        }),

    avatar: Joi.any().optional(),


    // Optional: add bank details validation if needed
    bankDetails: Joi.object({
        accountNumber: Joi.string()
            .pattern(/^\d{9,18}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Account number must be 9 to 18 digits'
            }),
        ifscCode: Joi.string()
            .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Invalid IFSC code format'
            }),
        bankName: Joi.string()
            .min(2)
            .max(100)
            .optional()
            .messages({
                'string.base': 'Bank name must be a string',
                'string.min': 'Bank name must be at least 2 characters',
                'string.max': 'Bank name must be at most 100 characters'
            }),
        upiId: Joi.string()
            .pattern(/^[\w.-]+@[\w.-]+$/)
            .optional()
            .messages({
                'string.pattern.base': 'Invalid UPI ID format'
            })
    }).optional()
})
    .prefs({ abortEarly: false, stripUnknown: true });