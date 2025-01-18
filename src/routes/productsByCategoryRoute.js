const express = require('express');
const productsByCategoryController = require('../controllers/productsByCategoryController');

const router = express.Router();

router.get('/:categoryId', productsByCategoryController.getProductsByCategory);

module.exports = router;
