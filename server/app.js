// server/app.js

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const problemRoutes = require('./routes/problemRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes'); // <<< ADD THIS LINE to import your new route

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', // IMPORTANT: Replace with your frontend's actual URL if different
  credentials: true, // Crucial for sending/receiving cookies with cross-origin requests
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/dashboard', dashboardRoutes); // <<< ADD THIS LINE to mount your new dashboard route

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