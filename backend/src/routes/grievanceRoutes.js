const express = require('express');
const grievanceController = require('../controllers/grievanceController');

const router = express.Router();

// Create a new grievance
router.post('/', grievanceController.createGrievance);

// Get all grievances (with filtering and pagination)
router.get('/', grievanceController.getAllGrievances);

// Get grievance statistics
router.get('/statistics', grievanceController.getStatistics);

// Get a specific grievance by ID
router.get('/:id', grievanceController.getGrievance);

// Update grievance status
router.patch('/:id/status', grievanceController.updateGrievanceStatus);

module.exports = router;