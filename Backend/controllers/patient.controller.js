import Patient from '../models/patient.model.js';
import { patientSchema } from '../validations/validationSchema.js';

// Sanitization middleware
const sanitizePatientInput = (req, res, next) => {
  if (req.body) {
    Object.entries(req.body).forEach(([key, value]) => {
      if (typeof value === 'string') req.body[key] = value.trim();
    });
    if (req.body.phone_number) {
      req.body.phone = req.body.phone_number;
      delete req.body.phone_number;
    }
  }
  next();
};

export const syncPatient = [
  sanitizePatientInput,
  async (req, res) => {
    try {
      // Validate request body
      const { error, value } = patientSchema.validate(req.body);
      if (error) {
        const errors = error.details.map(e => e.message);
        return res.status(400).json({ success: false, errors });
      }

      // Check for existing patient
      const existingPatient = await Patient.findOne({
        $or: [{ email: value.email }, { phone: value.phone }]
      });

      if (existingPatient) {
        return res.status(409).json({
          success: false,
          message: 'Patient already exists',
          existingId: existingPatient._id
        });
      }

      // Create new patient
      const newPatient = new Patient({
        ...value,
        phone: value.phone // ensure correct field name
      });

      await newPatient.save();

      // Sanitize output
      const patientData = newPatient.toObject();
      delete patientData.__v;

      res.status(201).json({
        success: true,
        message: 'Patient synced successfully',
        patient: patientData
      });

    } catch (error) {
      console.error('❌ Sync error:', error.message);

      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Patient with this email or phone already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error while syncing patient',
        error: process.env.NODE_ENV === 'development' ? error.message : null
      });
    }
  }
];

// Get all patients
export const getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      select: '-__v'
    };

    const patients = await Patient.paginate({}, options);

    res.status(200).json({
      success: true,
      data: patients.docs,
      total: patients.totalDocs,
      pages: patients.totalPages
    });

  } catch (err) {
    console.error("Error fetching patients:", err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};
