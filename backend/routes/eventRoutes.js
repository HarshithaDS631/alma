const express = require('express');
const { getEvents, createEvent, registerForEvent } = require('../controllers/eventController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', optionalProtect, getEvents);
router.post('/', protect, createEvent);
router.post('/:id/register', protect, registerForEvent);

module.exports = router;
