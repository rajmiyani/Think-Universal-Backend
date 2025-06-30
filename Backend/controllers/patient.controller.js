import mongoose from 'mongoose';
import MobileUser from '../models/mobileApp/patient.js';
import MobileAppointment from '../models/mobileApp/appointment.js';
import AdminPatient from '../models/patient.model.js';

export const getAllPatients = async (req, res) => {
  try {
    const { doctorId } = req.query;

    if (doctorId && !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctorId format' });
    }

    let filterUserIds = [];

    // 🔍 Step 1: Find appointments by doctorId to get userIds
    if (doctorId) {
      const appointments = await MobileAppointment.find({ doctorId }).select('userId');
      filterUserIds = [...new Set(appointments.map(a => a.userId.toString()))];
    }

    // 🔍 Step 2: Get mobile users (with filter if doctorId provided)
    const userQuery = doctorId ? { _id: { $in: filterUserIds } } : {};
    const mobileUsers = await MobileUser.find(userQuery).lean();

    let inserted = 0;
    let skipped = 0;
    const syncedPatients = [];

    for (const user of mobileUsers) {
      const email = user.email?.trim();
      const phone = user.contactNumber || user.phone_number?.toString();

      if (!email || !phone) {
        skipped++;
        continue;
      }

      const exists = await AdminPatient.findOne({
        $or: [{ email }, { phone }]
      });

      if (exists) {
        skipped++;
        continue;
      }

      try {
        const newPatient = await AdminPatient.create({
          firstName: user.firstName || user.name || 'Unknown',
          lastName: user.lastName || '',
          email,
          phone,
          contactNumber: phone,
          gender: user.gender || 'Other',
          age: 30,
          address: user.address || 'Not Provided',
          profileImage: user.profileImage || '',
          token: user.token || '',
          isOtpVerification: user.isOtpVerification ?? false,
          isOnline: user.isOnline ?? false,
          role: user.role || 'user'
        });

        inserted++;
        syncedPatients.push(newPatient);
      } catch (err) {
        console.warn(`⚠️ Failed to insert user with email: ${email}`);
        skipped++;
      }
    }

    return res.status(200).json({
      success: true,
      message: '✅ Patient sync completed',
      inserted,
      skipped,
      totalFetched: mobileUsers.length,
      patients: syncedPatients
    });

  } catch (err) {
    console.error("❌ Sync error:", err);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync patients',
      error: err.message
    });
  }
};
