const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_super_secret_jwt_key_here'; 


const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};


router.post('/:eventId', verifyToken, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user.userId || req.user.id;

  
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

  
    const existing = await Registration.findOne({ user: userId, event: eventId });
    if (existing) {
      return res.status(400).json({ error: 'You are already registered for this event!' });
    }


    const registration = new Registration({ user: userId, event: eventId });
    await registration.save();

    res.status(201).json({ message: 'Successfully registered!' });
  } catch (err) {
    console.error('Registration Post Error:', err);
    res.status(500).json({ error: err.message });
  }
});


router.get('/my-registrations', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;


    const registrations = await Registration.find({ user: userId }).populate('event');
    
    res.status(200).json(registrations);
  } catch (err) {
    console.error('Fetch Registrations Error:', err);
    res.status(500).json({ error: err.message });
  }
});



router.delete('/:eventId', verifyToken, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user.userId || req.user.id;

    const deletedRegistration = await Registration.findOneAndDelete({ user: userId, event: eventId });
    if (!deletedRegistration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.status(200).json({ message: 'Successfully canceled registration' });
  } catch (err) {
    console.error('Cancel Registration Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;