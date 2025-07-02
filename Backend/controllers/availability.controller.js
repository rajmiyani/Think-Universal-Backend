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
            fromTime,
            toTime,
            isMonthly,
            modes
        } = req.body;

        // ✅ Validate required fields
        if (!startDate || !fromTime || !toTime) {
            return res.status(400).json({
                success: false,
                message: 'startDate, fromTime, and toTime are required'
            });
        }

        const start = dayjs(startDate);
        const end = dayjs(endDate || startDate); // fallback to one day

        if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
            return res.status(400).json({ success: false, message: 'Invalid date range' });
        }

        // ✅ Identify doctor
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

        const insertedSlots = [];
        const conflicts = [];

        for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
            const date = d.toDate();

            const existing = await Availability.findOne({
                doctorId: doctor._id,
                startDate: date,
                endDate: date,
                $and: [
                    { fromTime: { $lt: toTime } },
                    { toTime: { $gt: fromTime } }
                ]
            });

            if (existing) {
                conflicts.push(d.format('YYYY-MM-DD'));
                continue;
            }

            const newSlot = await Availability.create({
                doctorId: doctor._id,
                firstName: doctor.firstName, // ✅ Corrected
                lastName: doctor.lastName,   // ✅ Corrected
                startDate: date,
                endDate: date,
                fromTime,
                toTime,
                isMonthly: isMonthly || false,
                modes
            });

            insertedSlots.push(newSlot);
        }

        return res.status(201).json({
            success: true,
            message: '✅ Availability added successfully',
            inserted: insertedSlots.length,
            skipped: conflicts.length,
            conflictDates: conflicts,
            slots: insertedSlots
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
        const { doctorId } = req.body ;

        if (doctorId && !mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ success: false, message: 'Invalid doctorId format' });
        }

        const doctorFilter = doctorId ? { _id: doctorId } : {};
        const doctors = await Doctor.find(doctorFilter);

        if (!doctors.length) {
            return res.status(404).json({ success: false, message: 'No doctors found' });
        }

        const availabilityFilter = doctorId ? { doctorId } : {};
        const allSlots = await Availability.find(availabilityFilter);

        const today = dayjs();
        let events = [];

        for (let slot of allSlots) {
            const doctor = doctors.find(d => d._id.toString() === slot.doctorId.toString());
            if (!doctor) continue;

            const doctorFullName = `${doctor.firstName} ${doctor.lastName}`;
            const modeList = Object.entries(slot.modes || {})
                .filter(([_, value]) => value)
                .map(([key]) => key);

            if (slot.isMonthly) {
                let current = dayjs(slot.date);
                const endDate = dayjs(slot.endMonth + '-01').endOf('month');
                const originalDay = current.date();

                while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
                    const repeatedDate = current.date(originalDay);
                    const startDateTime = dayjs(`${repeatedDate.format('YYYY-MM-DD')}T${slot.fromTime}`);
                    const isLocked = startDateTime.diff(today, 'hour') < 24;

                    events.push({
                        id: `${slot._id}-${repeatedDate.format('YYYY-MM-DD')}`,
                        doctorId: doctor._id,
                        doctorName: doctorFullName,
                        title: `${doctorFullName}: ${slot.fromTime} - ${slot.toTime}`,
                        start: `${repeatedDate.format('YYYY-MM-DD')}T${slot.fromTime}`,
                        end: `${repeatedDate.format('YYYY-MM-DD')}T${slot.toTime}`,
                        allDay: false,
                        isMonthly: true,
                        modes: modeList,
                        isLocked
                    });

                    current = current.add(1, 'month');
                }
            } else {
                const slotDate = dayjs(slot.date || slot.startDate); // fallback if old schema
                const startDateTime = dayjs(`${slotDate.format('YYYY-MM-DD')}T${slot.fromTime}`);
                const isLocked = startDateTime.diff(today, 'hour') < 24;

                events.push({
                    id: slot._id.toString(),
                    doctorId: doctor._id,
                    doctorName: doctorFullName,
                    title: `${doctorFullName}: ${slot.fromTime} - ${slot.toTime}`,
                    start: `${slotDate.format('YYYY-MM-DD')}T${slot.fromTime}`,
                    end: `${slotDate.format('YYYY-MM-DD')}T${slot.toTime}`,
                    allDay: false,
                    isMonthly: false,
                    modes: modeList,
                    isLocked
                });
            }
        }

        return res.status(200).json({
            success: true,
            events
        });

    } catch (err) {
        console.error('❌ getAvailabilityDoctor Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};