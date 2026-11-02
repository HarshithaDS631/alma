const express = require('express');
const { getEvents, createEvent, registerForEvent } = require('../controllers/eventController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const router = express.Router();

// Get events (Cached for 60 seconds with institutional scoping)
router.get('/', optionalProtect, cacheMiddleware(60, 'events:list'), getEvents);
router.post('/', protect, createEvent);
router.post('/:id/register', protect, registerForEvent);

module.exports = router;
