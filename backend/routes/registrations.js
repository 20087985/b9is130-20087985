const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
require('../models/Event'); // <-- Crucial: Registers the Event model for populate()
const auth = require('./auth');


router.post('/:eventId', auth, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user.userId;

    const existingRegistration = await Registration.findOne({ user: userId, event: eventId });
    if (existingRegistration) {
      return res.status(400).json({ error: 'You are already registered for this event!' });
    }

    const newRegistration = new Registration({
      user: userId,
      event: eventId
    });

    await newRegistration.save();
    res.status(201).json({ message: 'Successfully registered for the event!' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});


router.get('/my-registrations', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID not found in token' });
    }

    const registrations = await Registration.find({ user: userId }).populate('event');
    res.status(200).json(registrations);
  } catch (err) {
    console.error('Error fetching user registrations:', err);
    res.status(500).json({ error: 'Server error while fetching registrations' });
  }
});

module.exports = router;