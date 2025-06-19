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

        // ✅ Create availability
        const newAvailability = await Availability.create({
            doctorId: doctor._id,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            date: value.date,
            fromTime: value.fromTime,
            toTime: value.toTime,
            isMonthly: value.isMonthly,
            startMonth: value.isMonthly ? value.startMonth : undefined,
            endMonth: value.isMonthly ? value.endMonth : undefined
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
        const { firstName, lastName, start, end } = req.body;

        if (!firstName || !lastName) {
            return res.status(400).json({ success: false, message: 'Doctor name is required.' });
        }

        if (!start || !end) {
            return res.status(400).json({ success: false, message: 'Start and end dates are required.' });
        }

        const doctor = await Doctor.findOne({
            firstName: new RegExp('^' + firstName + '$', 'i'),
            lastName: new RegExp('^' + lastName + '$', 'i')
        });

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found.' });
        }

        const doctorId = doctor._id;
        const doctorFullName = `${doctor.firstName} ${doctor.lastName}`;

        const allSlots = await Availability.find({ doctorId });

        let events = [];

        for (let slot of allSlots) {
            if (slot.isMonthly) {
                let current = dayjs(slot.startMonth + '-01');
                const endDate = dayjs(slot.endMonth + '-01').endOf('month');
                const originalDay = dayjs(slot.date).date();

                while (current.isBefore(endDate)) {
                    const repeatedDate = current.date(originalDay);

                    if (repeatedDate.isBefore(dayjs(start)) || repeatedDate.isAfter(dayjs(end))) {
                        current = current.add(1, 'month');
                        continue;
                    }

                    events.push({
                        id: `${slot._id}-${repeatedDate.format('YYYY-MM-DD')}`,
                        title: `${doctorFullName}: ${slot.fromTime} - ${slot.toTime}`,
                        start: `${repeatedDate.format('YYYY-MM-DD')}T${slot.fromTime}`,
                        end: `${repeatedDate.format('YYYY-MM-DD')}T${slot.toTime}`,
                        allDay: false,
                        isMonthly: true
                    });

                    current = current.add(1, 'month');
                }
            } else {
                if (dayjs(slot.date).isBefore(dayjs(start)) || dayjs(slot.date).isAfter(dayjs(end))) continue;

                events.push({
                    id: slot._id,
                    title: `${doctorFullName}: ${slot.fromTime} - ${slot.toTime}`,
                    start: `${slot.date}T${slot.fromTime}`,
                    end: `${slot.date}T${slot.toTime}`,
                    allDay: false,
                    isMonthly: false
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
