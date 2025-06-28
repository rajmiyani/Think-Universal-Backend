import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
	{
		doctorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Doctor",  // Corrected the typo from "Dcotor" to "Doctor"
			required: true
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true
		},
		appointmentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Appointment",
			required: true
		},
		symptoms: {
			type: String,
			required: true
		},
		allergies: {
			type: String,
			required: false
		},
		currentMedications: {
			type: [mongoose.Schema.Types.Mixed],
			required: false
		},
		diagnosis: {
			type: String,
			required: true
		},
		treatmentPlan: {
			type: String,
			required: true
		},
		attachments: {
			type: String,
			required: false
		}
	},
	{
		timestamps: true,
	}
);

const Report = mongoose.model("Report", ReportSchema);

export default Report;