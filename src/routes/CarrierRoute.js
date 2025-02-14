// routes/CarrierRoute.js
const express = require('express');
const router = express.Router();
const CarrierController = require('../controllers/CarrierController');


// Routes cho admin
router.post('/', CarrierController.create);
router.put('/:id', CarrierController.update);
router.delete('/:id', CarrierController.delete);
router.patch('/:id/status', CarrierController.updateStatus);

// Routes cho mọi user đã đăng nhập
router.get('/', CarrierController.getAll);
router.get('/:id', CarrierController.getById);

module.exports = router;
