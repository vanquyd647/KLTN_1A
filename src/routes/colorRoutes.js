const express = require('express');
const router = express.Router();
const ensureSession = require('../middlewares/ensureSession');
const colorController = require('../controllers/colorController');

// Ensure session middleware applied to all color routes
router.use(ensureSession);
// GET /api/colors - Fetch all colors
router.get('/', colorController.getColors);

module.exports = router;
