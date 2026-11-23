const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
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
    const { title, clubName, date, location, description, capacity } = req.body;
    const parsedCapacity = Number(capacity);

    if (
      !title ||
      !clubName ||
      !date ||
      !location ||
      !description ||
      !Number.isFinite(parsedCapacity) ||
      parsedCapacity < 1
    ) {
      return res
        .status(400)
        .json({ error: 'All fields (including a valid capacity of at least 1) are required' });
    }

    const newEvent = new Event({
      title,
      clubName,
      date,
      location,
      description,
      capacity: parsedCapacity,
      registeredCount: 0,
      createdBy: req.user.userId
    });

    await newEvent.save();
    res.status(201).json({ message: 'Event created successfully!', event: newEvent });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Server error while creating event' });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { title, clubName, date, location, description, capacity } = req.body;
    const parsedCapacity = Number(capacity);

    if (
      !title ||
      !clubName ||
      !date ||
      !location ||
      !description ||
      !Number.isFinite(parsedCapacity) ||
      parsedCapacity < 1
    ) {
      return res
        .status(400)
        .json({ error: 'All fields (including a valid capacity of at least 1) are required' });
    }

    const existingEvent = await Event.findById(req.params.id);
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const currentRegistered = existingEvent.registeredCount ?? 0;
    if (parsedCapacity < currentRegistered) {
      return res.status(400).json({
        error: `Capacity cannot be less than current registrations (${currentRegistered})`,
      });
    }

    existingEvent.title = title;
    existingEvent.clubName = clubName;
    existingEvent.date = date;
    existingEvent.location = location;
    existingEvent.description = description;
    existingEvent.capacity = parsedCapacity;

    await existingEvent.save();
    res.status(200).json({ message: 'Event updated successfully!', event: existingEvent });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Server error while updating event' });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await Registration.deleteMany({ event: req.params.id });
    res.status(200).json({ message: 'Event deleted successfully!' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Server error while deleting event' });
  }
});

module.exports = router;