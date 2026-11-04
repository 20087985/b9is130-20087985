
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_super_secret_jwt_key_here'; 

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const token = authHeader.split(' ')[1]; 
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; 
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }

  router.get('/my-registrations', auth, async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.user.userId }).populate('event');
    res.status(200).json(registrations);
  } catch (err) {
    console.error('Error fetching user registrations:', err);
    res.status(500).json({ error: 'Server error while fetching registrations' });
  }
});
};


