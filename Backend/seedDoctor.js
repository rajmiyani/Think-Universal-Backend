import bcrypt from "bcryptjs";
import db from "./config/mongoose.js"; // DB connection
import Auth from "./models/auth.model.js"; // Your doctor model

db.once("open", async () => {
    try {
        const existing = await Auth.findOne({ email: "thinkuniversal@gmail.com" });
        if (existing) {
            console.log("🟡 Doctor already exists.");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash("Doctor@123", 10);

        const doctor = new Auth({
            email: "thinkuniversal@gmail.com",
            password: hashedPassword,
        });

        await doctor.save();
        console.log("✅ Doctor inserted successfully.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error inserting doctor:", err);
        process.exit(1);
    }
});