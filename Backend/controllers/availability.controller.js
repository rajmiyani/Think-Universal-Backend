import Availability from '../models/availability.model.js';
import Doctor from '../models/doctor.model.js';
import { availabilitySchema } from '../validations/validationSchema.js';
import dayjs from "dayjs";


export const setAvailability = async (req, res) => {
    try {
        // 1. Request Validation
        const { error, value } = availabilitySchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details.map(e => e.message)
            });
        }

        // 2. Doctor Verification
        const doctor = await Doctor.findById(value.doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        // 3. Time Slot Validation
        const existingSlot = await Availability.findOne({
            doctorId: value.doctorId,
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
                message: "Time slot overlaps with existing availability"
            });
        }

        // 4. Create Availability
        const newAvailability = await Availability.create({
            doctorId: value.doctorId,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            date: value.date,
            fromTime: value.fromTime,
            toTime: value.toTime,
            isMonthly: value.isMonthly
        });

        // 5. Response Sanitization
        const responseData = newAvailability.toObject();
        delete responseData.__v;

        return res.status(201).json({
            success: true,
            message: "Availability added successfully",
            data: responseData
        });

    } catch (err) {
        console.error("Availability Error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};


// 🗓️ Get availability in event format for calendar (by doctor name)
export const getAvailabilityDoctor = async (req, res) => {
    try {
        const { firstName, lastName, start, end } = req.body;

        // ✅ Input validation
        if (!firstName || !lastName) {
            return res.status(400).json({ success: false, message: "Doctor name is required." });
        }

        if (!start || !end) {
            return res.status(400).json({ success: false, message: "Start and end dates are required." });
        }

        // 🎯 Find doctor by name (case-insensitive)
        const doctor = await Doctor.findOne({
            firstName: new RegExp("^" + firstName + "$", "i"),
            lastName: new RegExp("^" + lastName + "$", "i")
        });
        console.log("Doctor : ", doctor);


        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found." });
        }

        const doctorId = doctor._id;
        const doctorFullName = `${doctor.firstName} ${doctor.lastName}`;

        // 📦 Get all slots (filter by doctorId)
        const allSlots = await Availability.find({ doctorId });

        let events = [];

        for (let slot of allSlots) {
            if (slot.isMonthly) {
                // 🔁 Repeat this slot on same day every month between start and end
                let current = dayjs(start).startOf("month");
                const endDate = dayjs(end).endOf("month");
                const originalDay = dayjs(slot.date).date(); // like 12th of the month

                while (current.isBefore(endDate)) {
                    const repeatedDate = current.date(originalDay);

                    if (
                        repeatedDate.isBefore(dayjs(start)) ||
                        repeatedDate.isAfter(endDate)
                    ) {
                        current = current.add(1, "month");
                        continue;
                    }

                    events.push({
                        id: `${slot._id}-${repeatedDate.format("YYYY-MM-DD")}`,
                        title: `${doctorFullName}: ${slot.fromTime} - ${slot.toTime}`,
                        start: `${repeatedDate.format("YYYY-MM-DD")}T${slot.fromTime}`,
                        end: `${repeatedDate.format("YYYY-MM-DD")}T${slot.toTime}`,
                        allDay: false,
                        isMonthly: true
                    });

                    current = current.add(1, "month");
                }

            } else {
                // ✅ One-time slot within start/end range
                if (
                    dayjs(slot.date).isBefore(dayjs(start)) ||
                    dayjs(slot.date).isAfter(dayjs(end))
                ) continue;

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
        console.error("❌ getCalendarAvailability error:", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
};