const express = require('express');
const router = express.Router();
const colorController = require('../controllers/colorController');

// GET /api/colors - Fetch all colors
router.get('/', colorController.getColors);

module.exports = router;
