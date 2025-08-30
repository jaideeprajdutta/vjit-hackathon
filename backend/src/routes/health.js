// src/routes/health.js
import express from 'express';

const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Grievance System API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;