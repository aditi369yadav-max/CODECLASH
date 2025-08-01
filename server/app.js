// server/app.js

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables. This is crucial for accessing process.env.FRONTEND_URL
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const problemRoutes = require('./routes/problemRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// --- CORRECTION FOR VERCEL DEPLOYMENT ---
// Get the frontend URL from an environment variable.
// This allows you to use a different URL for local development vs. production.
// If the environment variable isn't set (like during local dev), it defaults to localhost.
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

// Configure CORS to accept requests from the allowed origin.
app.use(cors({
  origin: allowedOrigin,
  credentials: true, // Crucial for sending/receiving cookies with cross-origin requests
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Define a simple root route for testing (optional, but good for quick checks)
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Optional: Add basic error handling middleware if not already present
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


module.exports = app;
