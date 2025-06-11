import Patient from '../models/patient.model.js';
import Joi from 'joi';



// --- Validation Schema ---
const patientSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\d{10,15}$/).required(),
    gender: Joi.string().valid('Male', 'Female', 'Other').required(),
    age: Joi.number().min(0).max(120).required(),
    address: Joi.string().min(5).max(200).required(),
});



export const getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 5, filter = "" } = req.query;

    const query = {
      name: { $regex: filter, $options: "i" } // Case-insensitive name filter
    };

    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({ patients, total });
  } catch (err) {
    console.error("❌ Error fetching patients:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        res.status(200).json({ success: true, patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
