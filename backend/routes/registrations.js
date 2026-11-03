const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const auth = require('../middleware/auth');


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

module.exports = router;