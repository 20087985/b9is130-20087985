const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Will be securely hashed
  createdAt: { type: Date, default: Date.now },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },
});

module.exports = mongoose.model('User', userSchema);