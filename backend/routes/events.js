const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin access required' });
  }
  next();
};

router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching events' });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
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