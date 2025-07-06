import mongoose from 'mongoose';
import Availability from '../models/availability.model.js';
import Doctor from '../models/doctor.model.js';
import { availabilitySchema } from '../validations/validationSchema.js';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js'; // ⬅️ Import plugin
dayjs.extend(isSameOrBefore); // ⬅️ Register it with dayjs


// 📅 Create Availability
export const setAvailability = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      startDate,
      endDate,
      timeSlots, // array of { fromTime, toTime }
      isMonthly,
      modes
    } = req.body;

    if (!startDate || !timeSlots?.length) {
      return res.status(400).json({
        success: false,
        message: 'startDate and timeSlots are required'
      });
    }

    const start = dayjs(startDate);
    const end = isMonthly ? dayjs(endDate) : start;

    if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range'
      });
    }

    let doctor;
    if (firstName && lastName && req.user.role === 'main') {
      doctor = await Doctor.findOne({
        firstName: new RegExp(`^${firstName}$`, 'i'),
        lastName: new RegExp(`^${lastName}$`, 'i')
      });
    } else {
      doctor = await Doctor.findById(req.user.id);
    }

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const inserted = [];
    const conflicts = [];

    for (
      let d = start.clone();
      d.isSameOrBefore(end, 'day');
      d = d.add(1, 'day')
    ) {
      const date = d.toDate();
      const slotToInsert = [];

      for (const slot of timeSlots) {
        const { fromTime, toTime } = slot;

        if (
          !fromTime ||
          !toTime ||
          dayjs(`2000-01-01T${toTime}`).isBefore(dayjs(`2000-01-01T${fromTime}`))
        ) {
          continue;
        }

        const conflict = await Availability.findOne({
          doctorId: doctor._id,
          startDate: date,
          endDate: date,
          slots: {
            $elemMatch: {
              fromTime: { $lt: toTime },
              toTime: { $gt: fromTime }
            }
          }
        });

        if (conflict) {
          conflicts.push({ date: d.format('YYYY-MM-DD'), slot });
          continue;
        }

        slotToInsert.push({ fromTime, toTime });
      }

      if (slotToInsert.length) {
        const newAvailability = await Availability.create({
          doctorId: doctor._id,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          startDate: date,
          endDate: date,
          slots: slotToInsert,
          isMonthly: isMonthly || false,
          modes
        });

        inserted.push(newAvailability);
      }
    }

    return res.status(201).json({
      success: true,
      message: '✅ Availability added successfully',
      inserted: inserted.length,
      skipped: conflicts.length,
      conflicts,
      slots: inserted
    });
  } catch (err) {
    console.error('❌ Availability Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// 📆 Get Calendar Availability
export const getAvailabilityDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing doctorId' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const allSlots = await Availability.find({ doctorId });
    const today = dayjs();
    const events = [];

    for (const slot of allSlots) {
      const doctorFullName = `${doctor.firstName} ${doctor.lastName}`;
      const modeList = Object.entries(slot.modes || {})
        .filter(([_, value]) => value)
        .map(([key]) => key);

      const currentDate = dayjs(slot.startDate);
      const isMonthly = slot.isMonthly;
      const repeatUntil = dayjs(slot.endDate);
      const dayOfMonth = currentDate.date();

      if (isMonthly) {
        // Repeat same day every month until endDate
        let current = currentDate.clone();
        while (current.isSameOrBefore(repeatUntil, 'month')) {
          for (const time of slot.slots || []) {
            const repeatedDate = current.date(dayOfMonth);
            const startDateTime = dayjs(`${repeatedDate.format('YYYY-MM-DD')}T${time.fromTime}`);
            const isLocked = startDateTime.diff(today, 'hour') < 24;

            events.push({
              id: `${slot._id}-${repeatedDate.format('YYYY-MM-DD')}-${time.fromTime}`,
              doctorId: doctor._id,
              doctorName: doctorFullName,
              title: `${doctorFullName}: ${time.fromTime} - ${time.toTime}`,
              start: `${repeatedDate.format('YYYY-MM-DD')}T${time.fromTime}`,
              end: `${repeatedDate.format('YYYY-MM-DD')}T${time.toTime}`,
              allDay: false,
              isMonthly: true,
              modes: modeList,
              isLocked
            });
          }

          current = current.add(1, 'month');
        }
      } else {
        // Non-monthly, just single or range dates
        const current = dayjs(slot.startDate);
        for (const time of slot.slots || []) {
          const startDateTime = dayjs(`${current.format('YYYY-MM-DD')}T${time.fromTime}`);
          const isLocked = startDateTime.diff(today, 'hour') < 24;

          events.push({
            id: `${slot._id}-${current.format('YYYY-MM-DD')}-${time.fromTime}`,
            doctorId: doctor._id,
            doctorName: doctorFullName,
            title: `${doctorFullName}: ${time.fromTime} - ${time.toTime}`,
            start: `${current.format('YYYY-MM-DD')}T${time.fromTime}`,
            end: `${current.format('YYYY-MM-DD')}T${time.toTime}`,
            allDay: false,
            isMonthly: false,
            modes: modeList,
            isLocked
          });
        }
      }
    }

    return res.status(200).json({ success: true, events });
  } catch (err) {
    console.error('❌ getAvailabilityDoctor Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};
