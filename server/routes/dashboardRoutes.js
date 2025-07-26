const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController'); // Adjust path if necessary
const { requireAuth } = require('../middlewares/authMiddleware'); // Import your authentication middleware

// Route to get dashboard data for the authenticated user
// This route will be accessible at /api/dashboard/ if mounted in server.js
router.get('/', requireAuth, getDashboardData);

module.exports = router;