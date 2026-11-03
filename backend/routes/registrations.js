// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_super_secret_jwt_key_here'; // Must match your auth.js secret key

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const token = authHeader.split(' ')[1]; // Bearer <token>
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // Attach user info to request
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};