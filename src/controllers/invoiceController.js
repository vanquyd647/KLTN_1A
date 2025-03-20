const invoiceService = require('../services/invoiceService');
const logger = require('../configs/winston');
const fs = require('fs'); // Thêm dòng này
const path = require('path'); // Thêm dòng này


const InvoiceController = {
    // Tạo hóa đơn mới từ đơn hàng đã hoàn thành
    createInvoice: async (req, res) => {
        try {
            const { order_id } = req.body;
            const creatorId = req.userId; // Lấy từ token đăng nhập
            const notes = req.body.notes || null;

            if (!order_id) {
                return res.status(400).json({
                    code: 400,
                    success: false,
                    message: 'Thiếu ID đơn hàng'
                });
            }

            const invoice = await invoiceService.createInvoice(order_id, creatorId, notes);

            return res.status(201).json({
                code: 201,
                success: true,
                message: 'Tạo hóa đơn thành công',
                data: invoice
            });
        } catch (error) {
            logger.error(`[InvoiceController] createInvoice error: ${error.message}`);
            return res.status(error.status || 500).json({
                code: 500,
                success: false,
                message: error.message || 'Đã xảy ra lỗi khi tạo hóa đơn'
            });
        }
    },

    // Lấy hóa đơn theo ID
    getInvoiceById: async (req, res) => {
        try {
            const { id } = req.params;
            const invoice = await invoiceService.getInvoiceById(id);
            return res.status(200).json({
                code: 200,
                success: true,
                data: invoice
            });
        } catch (error) {
            logger.error('Error in getInvoiceById controller:', error);
            return res.status(error.message === 'Hóa đơn không tồn tại' ? 404 : 500).json({
                code: 500,
                success: false,
                message: error.message || 'Đã xảy ra lỗi khi lấy thông tin hóa đơn'
            });
        }
    },

    // Lấy tất cả hóa đơn với phân trang
    getAllInvoices: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await invoiceService.getAllInvoices(page, limit);
            return res.status(200).json({
                code: 200,
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error in getAllInvoices controller:', error);
            return res.status(500).json({
                code: 500,
                success: false,
                message: error.message || 'Đã xảy ra lỗi khi lấy danh sách hóa đơn'
            });
        }
    },

    // Tìm kiếm hóa đơn
    searchInvoices: async (req, res) => {
        try {
            const searchParams = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await invoiceService.searchInvoices(searchParams, page, limit);
            return res.status(200).json({
                code: 200,
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error in searchInvoices controller:', error);
            return res.status(500).json({
                code: 500,
                success: false,
                message: error.message || 'Đã xảy ra lỗi khi tìm kiếm hóa đơn'
            });
        }
    },

    // Tạo file PDF cho hóa đơn
    generateInvoicePDF: async (req, res) => {
        try {
            const { orderId } = req.params;
            const creatorId = req.userId;
            const { id } = req.params;

            console.log('order_id', orderId);

            const pdfPath = await invoiceService.generateInvoicePDF(id, creatorId, orderId);

            // Kiểm tra xem file có tồn tại không
            if (!fs.existsSync(pdfPath)) {
                return res.status(404).json({
                    code: 404,
                    success: false,
                    message: 'Không tìm thấy file PDF hóa đơn'
                });
            }

            // Thiết lập response để download file
            const fileName = path.basename(pdfPath);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

            // Gửi file về client
            fs.createReadStream(pdfPath).pipe(res);
        } catch (error) {
            logger.error('Error in generateInvoicePDF controller:', error);
            return res.status(500).json({
                code: 500,
                success: false,
                message: error.message || 'Đã xảy ra lỗi khi tạo file PDF hóa đơn'
            });
        }
    },

};

module.exports = InvoiceController;
