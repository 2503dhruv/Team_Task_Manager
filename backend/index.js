const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Connection Error:', err));

// Health Check Route
app.get('/', (req, res) => res.send('Task Manager API is running...'));

// --- ROUTES ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects')); // Add this
app.use('/api/tasks', require('./routes/tasks'));       // Add this

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));