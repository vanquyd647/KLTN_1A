const express = require('express');
const router = express.Router();
const productStockController = require('../controllers/productStockController');

router.get('/', productStockController.getProductStocks);

module.exports = router;
