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

        let doctor;

        // 🧠 Check if main doctor is adding for a sub doctor
        if (value.firstName && value.lastName && req.user.role === 'main') {
            doctor = await Doctor.findOne({
                firstName: new RegExp('^' + value.firstName + '$', 'i'),
                lastName: new RegExp('^' + value.lastName + '$', 'i')
            });
        } else {
            // 👤 Sub doctor updating their own availability
            doctor = await Doctor.findById(req.user.id);
        }

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

        // ✅ Save availability
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

        return res.status(201).json({
            success: true,
            message: 'Availability added successfully',
            data: {
                ...newAvailability.toObject(),
                __v: undefined
            }
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
        const doctors = await Doctor.find({});
        if (!doctors.length) {
            return res.status(404).json({ success: false, message: 'No doctors found' });
        }

        const allSlots = await Availability.find({});
        const today = dayjs();
        const start = today.startOf('month');
        const end = today.endOf('month');

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
        console.error('❌ getAllDoctorsAvailability Error:', err);
        return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
