// seed/report.seed.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Report from '../models/report.model.js';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        await Report.deleteMany();

        await Report.insertMany([
            {
                doctor: "Dr. John",
                patient: "Raj Morsy",
                status: "Completed",
                date: new Date("2024-06-10"),
                fees: 500,
                reportNote: "Routine checkup",
                reportFile: "report1.pdf"
            },
            {
                doctor: "Dr. John",
                patient: "Alisha",
                status: "Cancelled",
                date: new Date("2024-05-12"),
                fees: 0,
                reportNote: "Appointment cancelled",
                reportFile: "cancel.pdf"
            },
            {
                doctor: "Dr. Asha",
                patient: "Jay Patel",
                status: "Upcoming",
                date: new Date("2024-06-15"),
                fees: 400,
                reportNote: "Follow-up",
                reportFile: "followup.pdf"
            }
        ]);

        console.log("🌱 Seeded 3 reports");
        process.exit();
    } catch (err) {
        console.error("❌ Seeding Error:", err.message);
        process.exit(1);
    }
};

seed();
