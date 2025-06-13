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

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);

        await Report.insertMany([
            {
                doctor: "Dr. John",
                patient: "Raj Morsy",
                status: "Completed",
                date: tomorrow,
                fees: 500,
                reportNote: "Routine checkup",
                reportFile: "report1.pdf"
            },
            {
                doctor: "Dr. John",
                patient: "Alisha",
                status: "Cancelled",
                date: nextWeek,
                fees: 0,
                reportNote: "Appointment cancelled",
                reportFile: "cancel.pdf"
            },
            {
                doctor: "Dr. Asha",
                patient: "Jay Patel",
                status: "Upcoming",
                date: nextMonth,
                fees: 400,
                reportNote: "Follow-up",
                reportFile: "followup.pdf"
            }
        ]);

        console.log("🌱 Seeded 3 future reports");
        process.exit();
    } catch (err) {
        console.error("❌ Seeding Error:", err.message);
        process.exit(1);
    }
};

seed();