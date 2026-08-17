const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Get all events
// @route   GET /api/events
exports.getEvents = async (req, res) => {
    try {
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
            organizer: req.user._id
        });

        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Register for an event
// @route   POST /api/events/:id/register
exports.registerForEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.attendees.includes(req.user._id)) {
            return res.status(400).json({ message: 'You are already registered' });
        }

        if (event.maxCapacity && event.attendees.length >= event.maxCapacity) {
            return res.status(400).json({ message: 'Event is full' });
        }

        event.attendees.push(req.user._id);
        await event.save();
        
        res.json({ message: 'Registered successfully', event });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

