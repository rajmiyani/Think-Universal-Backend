import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

const sendOTPEmail = async (email) => {
    const otp = Math.floor(100000 + Math.random() * 900000);

    console.log("🔐 OTP to send:", otp); // ✅ make sure it logs

    const updateLink = `https://yourfrontenddomain.com/update-password?email=${encodeURIComponent(email)}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Password Reset OTP',
        text: `Your OTP is ${otp}. It is valid for 10 minutes. DO NOT share it with anyone.

To reset your password, click the link below:
${updateLink}

If you didn’t request this, please ignore this email.`,

        html: `
    <p><strong>Your OTP is:</strong> <span style="font-size:18px;">${otp}</span></p>
    <p>It is valid for <strong>10 minutes</strong>. <br />DO NOT share it with anyone.</p>
    <br />
    <p>To reset your password, click the button below:</p>
    <a href="${updateLink}" style="padding:10px 20px; background-color:#4CAF50; color:white; text-decoration:none;">Reset Password</a>
    <br/><br/>
    <p>If you didn’t request this, please ignore this email.</p>
  `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, otp };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export default sendOTPEmail;