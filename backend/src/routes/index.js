const express = require('express');
const grievanceRoutes = require('./grievanceRoutes');
const fileRoutes = require('./fileRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Grievance System API'
  });
});

// API routes
router.use('/grievances', grievanceRoutes);
router.use('/files', fileRoutes);
router.use('/users', userRoutes);

module.exports = router;