const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Atlas Connected Successfully'))
  .catch((err) => console.error('Database connection error:', err));

// Test Route
app.get('/', (req, res) => {
  res.send('Campus Club Event API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const eventRoutes = require('./routes/events');
app.use('/api/events', eventRoutes);