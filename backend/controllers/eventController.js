const Event = require('../models/Event');
const User = require('../models/User');
const connectDB = require('../config/db');
const { invalidateCache } = require('../middleware/cacheMiddleware');
const QRCode = require('qrcode');
const crypto = require('crypto');

// @desc    Get all events
// @route   GET /api/events
exports.getEvents = async (req, res) => {
    try {
        await connectDB();
        let query = {};
        
        // Non-super-admins only see events for their institution or global events
        if (req.user && req.user.role !== 'Super Admin') {
            const userDoc = await User.findById(req.user._id).select('institution');
            const userInstitution = req.user.institution || userDoc?.institution;
            if (userInstitution) {
                query.$or = [
                    { institution: new RegExp(`^${userInstitution.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                    { institution: 'All Institutions' }
                ];
            }
        } else if (req.query.institution && req.query.institution !== 'All') {
            query.institution = new RegExp(`^${req.query.institution.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        }

        const events = await Event.find(query).populate('organizer', 'name email institution').sort({ date: 1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an event
// @route   POST /api/events
exports.createEvent = async (req, res) => {
    try {
        await connectDB();
        const { title, description, date, location, type, image, maxCapacity, price, institution } = req.body;
        
        const userDoc = await User.findById(req.user._id).select('institution');
        const eventInstitution = institution || req.user.institution || userDoc?.institution || 'RV College of Engineering';

        const event = await Event.create({
            title,
            description,
            date,
            location,
            type,
            institution: eventInstitution,
            image,
            maxCapacity,
            price,
            organizer: req.user._id,
            attendees: [req.user._id]
        });

        invalidateCache([
            'events:list:global:',
            `events:list:${eventInstitution}:`
        ]);

        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Register for an event & generate Digital QR Pass
// @route   POST /api/events/:id/register
exports.registerForEvent = async (req, res) => {
    try {
        await connectDB();
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const isAlreadyRegistered = event.attendees.some(a => a.toString() === req.user._id.toString());
        if (isAlreadyRegistered) {
            return res.status(400).json({ message: 'You are already registered for this event' });
        }

        if (event.maxCapacity && event.attendees.length >= event.maxCapacity) {
            return res.status(400).json({ message: 'Event has reached maximum capacity' });
        }

        const passToken = crypto.randomBytes(16).toString('hex');
        const qrPayload = JSON.stringify({
            eventId: event._id.toString(),
            attendeeId: req.user._id.toString(),
            token: passToken
        });
        const qrCode = await QRCode.toDataURL(qrPayload, { width: 300, margin: 2 });

        event.attendees.push(req.user._id);
        event.registrations = event.registrations || [];
        event.registrations.push({
            user: req.user._id,
            passToken,
            qrCode,
            checkedIn: false,
            registeredAt: new Date()
        });

        await event.save();
        
        res.json({
            message: 'Registered successfully! Your Digital Event Pass has been issued.',
            passToken,
            qrCode,
            event
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's Digital Event Pass
// @route   GET /api/events/:id/pass
exports.getEventPass = async (req, res) => {
    try {
        await connectDB();
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const isRegistered = event.attendees.some(a => a.toString() === req.user._id.toString());
        if (!isRegistered) {
            return res.status(403).json({ message: 'You are not registered for this event' });
        }

        event.registrations = event.registrations || [];
        let reg = event.registrations.find(r => r.user.toString() === req.user._id.toString());

        // Lazily generate pass for legacy registrations
        if (!reg || !reg.qrCode) {
            const passToken = crypto.randomBytes(16).toString('hex');
            const qrPayload = JSON.stringify({
                eventId: event._id.toString(),
                attendeeId: req.user._id.toString(),
                token: passToken
            });
            const qrCode = await QRCode.toDataURL(qrPayload, { width: 300, margin: 2 });

            if (!reg) {
                reg = { user: req.user._id, passToken, qrCode, checkedIn: false, registeredAt: new Date() };
                event.registrations.push(reg);
            } else {
                reg.passToken = passToken;
                reg.qrCode = qrCode;
            }
            await event.save();
        }

        const userDoc = await User.findById(req.user._id).select('name email department batch graduationYear institution avatar');

        res.json({
            eventId: event._id,
            eventTitle: event.title,
            date: event.date,
            location: event.location,
            type: event.type,
            institution: event.institution,
            attendee: {
                id: userDoc?._id,
                name: userDoc?.name,
                email: userDoc?.email,
                department: userDoc?.department,
                graduationYear: userDoc?.graduationYear || userDoc?.batch,
                institution: userDoc?.institution
            },
            passToken: reg.passToken,
            qrCode: reg.qrCode,
            checkedIn: reg.checkedIn,
            checkedInAt: reg.checkedInAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify and check in attendee at campus gate / entrance
// @route   POST /api/events/:id/check-in
exports.checkInAttendee = async (req, res) => {
    try {
        await connectDB();
        const { passToken, rawScan } = req.body;
        let tokenToVerify = passToken;

        if (!tokenToVerify && rawScan) {
            try {
                const parsed = JSON.parse(rawScan);
                tokenToVerify = parsed.token;
            } catch (_err) {
                tokenToVerify = rawScan.trim();
            }
        }

        if (!tokenToVerify) {
            return res.status(400).json({ message: 'Pass token or QR scan code is required' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        event.registrations = event.registrations || [];
        const reg = event.registrations.find(r => r.passToken === tokenToVerify);

        if (!reg) {
            return res.status(404).json({ message: 'Invalid or counterfeit event pass token' });
        }

        if (reg.checkedIn) {
            return res.status(400).json({
                message: `Attendee is already checked in at ${new Date(reg.checkedInAt).toLocaleTimeString()}`,
                checkedInAt: reg.checkedInAt
            });
        }

        reg.checkedIn = true;
        reg.checkedInAt = new Date();
        await event.save();

        const attendeeUser = await User.findById(reg.user).select('name email department batch graduationYear institution avatar');

        res.json({
            success: true,
            message: `Check-in verified for ${attendeeUser?.name || 'Attendee'}!`,
            attendee: {
                name: attendeeUser?.name,
                email: attendeeUser?.email,
                department: attendeeUser?.department,
                graduationYear: attendeeUser?.graduationYear || attendeeUser?.batch,
                institution: attendeeUser?.institution
            },
            checkedInAt: reg.checkedInAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get real-time event attendance summary
// @route   GET /api/events/:id/attendance
exports.getEventAttendance = async (req, res) => {
    try {
        await connectDB();
        const event = await Event.findById(req.params.id).populate('registrations.user', 'name email department graduationYear batch');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const totalRegistered = event.attendees.length;
        const registrations = event.registrations || [];
        const totalCheckedIn = registrations.filter(r => r.checkedIn).length;

        res.json({
            eventId: event._id,
            eventTitle: event.title,
            totalRegistered,
            totalCheckedIn,
            checkInRate: totalRegistered > 0 ? `${Math.round((totalCheckedIn / totalRegistered) * 100)}%` : '0%',
            attendees: registrations.map(r => ({
                userId: r.user?._id,
                name: r.user?.name,
                email: r.user?.email,
                department: r.user?.department,
                graduationYear: r.user?.graduationYear || r.user?.batch,
                checkedIn: r.checkedIn,
                checkedInAt: r.checkedInAt,
                registeredAt: r.registeredAt
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
