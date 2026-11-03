const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Atlas Connected Successfully'))
  .catch((err) => console.error('Database connection error:', err));

app.get('/', (req, res) => {
  res.send('Campus Club Event API is running...');
});


const eventRoutes = require('./routes/events');
app.use('/api/events', eventRoutes);

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const registrationRoutes = require('./routes/registrations');
app.use('/api/registrations', registrationRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});