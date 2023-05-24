const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// Student registration route
router.post('/register', studentController.register);

// Student login route
router.post('/login', studentController.login);

module.exports = router;
