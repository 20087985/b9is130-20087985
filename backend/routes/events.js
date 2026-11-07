const express = require('express');
const router = express.Router();
const Event = require('../models/Event');


router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});


router.post('/', auth, async (req, res) => {
  try {
    const { title, clubName, date, location, description } = req.body;

    if (!title || !clubName || !date || !location || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newEvent = new Event({
      title,
      clubName,
      date,
      location,
      description,
      createdBy: req.user.userId
    });

    await newEvent.save();
    res.status(201).json({ message: 'Event created successfully!', event: newEvent });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Server error while creating event' });
  }
});

module.exports = router;