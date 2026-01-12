const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const { initializeFirebase } = require('./config/firebase');

const app = express();
const PORT = process.env.PORT || 8080;
const db = require('./db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
db.connectdb();

// Initialize Firebase
initializeFirebase();

// Routes
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/report');
const mapRoutes = require('./routes/map');
const voteRoutes = require('./routes/vote');
const assignmentRoutes = require('./routes/assignment');
const departmentRoutes = require('./routes/department');
const alertRoutes = require('./routes/alert');
const uploadRoutes = require('./routes/upload');
const institutionRoutes = require('./routes/institution');




app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/institutions', institutionRoutes);




// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error'
  });
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});