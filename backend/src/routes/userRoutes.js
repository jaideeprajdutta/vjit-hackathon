const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// User authentication/login
router.post('/login', userController.loginUser);

// Get user profile
router.get('/:userId', userController.getUserProfile);

// Get institutions list
router.get('/institutions/list', userController.getInstitutions);

module.exports = router;