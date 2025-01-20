const express = require('express');
const productsByCategoryController = require('../controllers/productsByCategoryController');
const ensureSession = require('../middlewares/ensureSession');

const router = express.Router();
router.use(ensureSession);



router.get('/:categoryId', productsByCategoryController.getProductsByCategory);

module.exports = router;
