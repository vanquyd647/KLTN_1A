const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');

// Route tạo hóa đơn mới từ đơn hàng đã hoàn thành
// POST /api/invoices/create
// Body: { order_id: string, notes?: string }
router.post('/create', adminAuthMiddleware, invoiceController.createInvoice);

// Lấy chi tiết hóa đơn theo ID
// GET /api/invoices/:id
router.get('/:id', adminAuthMiddleware, invoiceController.getInvoiceById);

// Lấy tất cả hóa đơn với phân trang
// GET /api/invoices?page=1&limit=10
router.get('/', adminAuthMiddleware, invoiceController.getAllInvoices);

// Tìm kiếm hóa đơn
// GET /api/invoices/search?invoiceNumber=IV&page=1&limit=10
router.get('/search', adminAuthMiddleware, invoiceController.searchInvoices);

// Tạo và tải file PDF cho hóa đơn
// GET /api/invoices/:id/pdf
router.get('/:id/pdf/:orderId', adminAuthMiddleware, invoiceController.generateInvoicePDF);

module.exports = router;
