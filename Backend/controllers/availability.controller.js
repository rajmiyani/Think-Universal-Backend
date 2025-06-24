import Availability from '../models/availability.model.js';
import Doctor from '../models/doctor.model.js';
import { availabilitySchema } from '../validations/validationSchema.js';
import dayjs from 'dayjs';

// 📅 Create Availability
export const setAvailability = async (req, res) => {
    try {
        const { error, value } = availabilitySchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details.map(e => e.message)
            });
        }

        // 🔍 Find doctor by name
        const doctor = await Doctor.findOne({
            firstName: new RegExp('^' + value.firstName + '$', 'i'),
            lastName: new RegExp('^' + value.lastName + '$', 'i')
        });

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        // ⛔ Overlap check
        const existingSlot = await Availability.findOne({
            doctorId: doctor._id,
            date: value.date,
            $or: [
                {
                    fromTime: { $lt: value.toTime },
                    toTime: { $gt: value.fromTime }
                }
            ]
        });

        if (existingSlot) {
            return res.status(409).json({
                success: false,
                message: 'Time slot overlaps with existing availability'
            });
        }

        // ✅ Create availability (no modes/startMonth)
        const newAvailability = await Availability.create({
            doctorId: doctor._id,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            date: value.date,
            fromTime: value.fromTime,
            toTime: value.toTime,
            isMonthly: value.isMonthly,
            endMonth: value.isMonthly ? value.endMonth : undefined,
            modes: value.modes
        });

        const responseData = newAvailability.toObject();
        delete responseData.__v;

        return res.status(201).json({
            success: true,
            message: 'Availability added successfully',
            data: responseData
        });
    } catch (err) {
        console.error('Availability Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message,
            stack: err.stack
        });
    }
};


// 📆 Get Calendar Availability
export const getAvailabilityDoctor = async (req, res) => {
    try {
        const { firstName, lastName } = req.body;

        if (!firstName || !lastName) {
            return res.status(400).json({ success: false, message: 'Doctor name is required.' });
        }

        const doctor = await Doctor.findOne({
            firstName: new RegExp('^' + firstName + '$', 'i'),
            lastName: new RegExp('^' + lastName + '$', 'i'),
        });

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found.' });
        }

        const doctorId = doctor._id;
        const doctorFullName = `${doctor.firstName} ${doctor.lastName}`;
        const allSlots = await Availability.find({ doctorId });

        let events = [];

        // Define default range: current month
        const today = dayjs();
        const start = today.startOf('month');
        const end = today.endOf('month');

        for (let slot of allSlots) {
            const modeList = Object.entries(slot.modes || {})
                .filter(([_, value]) => value)
                .map(([key]) => key);

            if (slot.isMonthly) {
                let current = dayjs(slot.startMonth + '-01');
                const endDate = dayjs(slot.endMonth + '-01').endOf('month');
                const originalDay = dayjs(slot.date).date();

                while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
                    const repeatedDate = current.date(originalDay);

                    if (repeatedDate.isBefore(start) || repeatedDate.isAfter(end)) {
                        current = current.add(1, 'month');
                        continue;
                    }

                    events.push({
                        id: `${slot._id}-${repeatedDate.format('YYYY-MM-DD')}`,
                        title: `${doctorFullName}: ${slot.fromTime} - ${slot.toTime}`,
                        start: `${repeatedDate.format('YYYY-MM-DD')}T${slot.fromTime}`,
                        end: `${repeatedDate.format('YYYY-MM-DD')}T${slot.toTime}`,
                        allDay: false,
                        isMonthly: true,
                        modes: modeList
                    });

                    current = current.add(1, 'month');
                }
            } else {
                const slotDate = dayjs(slot.date);
                if (slotDate.isBefore(start) || slotDate.isAfter(end)) continue;

                events.push({
                    id: slot._id.toString(),
                    title: `${doctorFullName}: ${slot.fromTime} - ${slot.toTime}`,
                    start: `${slotDate.format('YYYY-MM-DD')}T${slot.fromTime}`,
                    end: `${slotDate.format('YYYY-MM-DD')}T${slot.toTime}`,
                    allDay: false,
                    isMonthly: false,
                    modes: modeList
                });
            }
        }

        return res.status(200).json({
            success: true,
            events
        });
    } catch (err) {
        console.error('❌ getCalendarAvailability error:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};
