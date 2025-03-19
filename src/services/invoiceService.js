const { sequelize } = require('../models');
const { Order, OrderDetails, OrderItem, Invoice, InvoiceItem, User, Payment, Product, Size, Color } = require('../models');
const logger = require('../configs/winston');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const InvoiceService = {
    // Tạo hóa đơn từ đơn hàng đã hoàn thành
    createInvoice: async (orderId, creatorId, notes = null) => {
        const t = await sequelize.transaction();
        let newInvoice;

        try {
            // Kiểm tra đơn hàng tồn tại và đã hoàn thành
            const order = await Order.findByPk(orderId, {
                include: [
                    {
                        model: OrderDetails,
                        as: 'orderDetails',
                        required: false
                    },
                    { model: User },
                    {
                        model: OrderItem,
                        include: [
                            { model: Product },
                            { model: Size },
                            { model: Color }
                        ]
                    },
                    { model: Payment },
                ],
                transaction: t
            });

            // Thêm debugging để kiểm tra
            console.log('Order data:', JSON.stringify(order, null, 2));

            if (!order) {
                throw new Error('Đơn hàng không tồn tại');
            }

            if (order.status !== 'completed') {
                throw new Error('Chỉ có thể tạo hóa đơn cho đơn hàng đã hoàn thành');
            }

            // Kiểm tra xem đơn hàng đã có hóa đơn chưa
            const existingInvoice = await Invoice.findOne({
                where: { order_id: orderId },
                transaction: t
            });

            if (existingInvoice) {
                throw new Error('Đơn hàng này đã có hóa đơn');
            }

            // Kiểm tra và log thông tin orderDetails để debug
            console.log('OrderDetails exists:', !!order.orderDetails);
            if (order.orderDetails) {
                console.log('OrderDetails data:', {
                    name: order.orderDetails.name,
                    email: order.orderDetails.email,
                    phone: order.orderDetails.phone
                });
            }

            // Lấy thông tin thanh toán
            const payment = order.Payment;
            if (!payment || payment.payment_status !== 'paid') {
                throw new Error('Đơn hàng chưa được thanh toán đầy đủ');
            }

            // Tạo mã hóa đơn duy nhất: IV-YYYYMMDD-XXXX (X là số ngẫu nhiên)
            const today = new Date();
            const dateStr = today.getFullYear() +
                ('0' + (today.getMonth() + 1)).slice(-2) +
                ('0' + today.getDate()).slice(-2);
            const randomNum = Math.floor(1000 + Math.random() * 9000); // 1000-9999
            const invoiceNumber = `IV-${dateStr}-${randomNum}`;

            // Chuẩn bị thông tin người mua (thêm xử lý fallback)
            let buyerName, buyerEmail, buyerPhone, buyerAddress;

            // Lấy thông tin từ OrderDetails nếu có
            if (order.orderDetails && order.orderDetails.length > 0) {
                buyerName = order.orderDetails[0].name;
                buyerEmail = order.orderDetails[0].email;
                buyerPhone = order.orderDetails[0].phone;
                buyerAddress = `${order.orderDetails[0].street || ''}, ${order.orderDetails[0].ward || ''}, ${order.orderDetails[0].district || ''}, ${order.orderDetails[0].city || ''}, ${order.orderDetails[0].country || ''}`;
            }

            // Nếu không có OrderDetails hoặc thiếu thông tin, lấy từ User
            if (!buyerName && order.User) {
                buyerName = order.User.name;
            }
            if (!buyerEmail && order.User) {
                buyerEmail = order.User.email;
            }
            if (!buyerPhone && order.User) {
                buyerPhone = order.User.phone;
            }

            // Đảm bảo các giá trị không bị null
            buyerName = buyerName || 'Khách hàng';
            buyerEmail = buyerEmail || 'customer@example.com';
            buyerPhone = buyerPhone || '0000000000';
            buyerAddress = buyerAddress || 'Không có địa chỉ';

            // Tạo dữ liệu hóa đơn với thông tin đã kiểm tra
            const invoiceData = {
                order_id: order.id,
                invoice_number: invoiceNumber,
                creator_id: creatorId,
                buyer_id: order.user_id,
                buyer_name: buyerName,
                buyer_email: buyerEmail,
                buyer_phone: buyerPhone,
                buyer_address: buyerAddress,
                shipping_fee: order.shipping_fee,
                discount_amount: order.discount_amount,
                original_price: order.original_price,
                final_price: order.final_price,
                payment_method: payment.payment_method,
                payment_status: 'completed',
                notes: notes,
                issue_date: new Date(),
            };

            // Log dữ liệu trước khi tạo hóa đơn để debug
            console.log('Invoice data to create:', invoiceData);

            newInvoice = await Invoice.create(invoiceData, { transaction: t });

            // Tạo các mục chi tiết hóa đơn (InvoiceItem) từ các mục đơn hàng (OrderItem)
            if (order.OrderItems && order.OrderItems.length > 0) {
                const invoiceItems = order.OrderItems.map(item => ({
                    invoice_id: newInvoice.id,
                    product_id: item.product_id,
                    size_id: item.size_id,
                    color_id: item.color_id,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity
                }));

                await InvoiceItem.bulkCreate(invoiceItems, { transaction: t });
                console.log(`Đã tạo ${invoiceItems.length} mục hóa đơn chi tiết`);
            }

            // Trả về hóa đơn đầy đủ với các mục chi tiết, vẫn trong transaction
            const completeInvoice = await Invoice.findByPk(newInvoice.id, {
                include: [
                    {
                        model: InvoiceItem, as: 'InvoiceItems',
                        include: [
                            { model: Product },
                            { model: Size },
                            { model: Color }
                        ]
                    }
                ],
                transaction: t  // Sử dụng cùng transaction
            });

            await t.commit();
            return completeInvoice;
        } catch (error) {
            if (t && !t.finished) {
                await t.rollback();
            }
            logger.error(`Lỗi khi tạo hóa đơn: ${error.message}`);
            throw error;
        }
    },

    getInvoiceById: async (invoiceId) => {
        try {
            const invoice = await Invoice.findByPk(invoiceId, {
                include: [
                    {
                        model: InvoiceItem, as: 'InvoiceItems',
                        include: [
                            { model: Product },
                            { model: Size },
                            { model: Color }
                        ]
                    },
                    { model: Order },
                    {
                        model: User,
                        as: 'Creator',
                        attributes: ['id', 'email', 'firstname', 'lastname']
                    },
                    {
                        model: User,
                        as: 'Buyer',
                        attributes: ['id', 'email', 'firstname', 'lastname']
                    }
                ]
            });

            if (!invoice) {
                throw new Error('Hóa đơn không tồn tại');
            }

            return invoice;
        } catch (error) {
            logger.error('Error in getInvoiceById:', error);
            throw error;
        }
    },

    // Thêm phương thức lấy tất cả hóa đơn với phân trang
    getAllInvoices: async (page = 1, limit = 10) => {
        try {
            const offset = (page - 1) * limit;
            const { count, rows } = await Invoice.findAndCountAll({
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'email', 'full_name']
                    },
                    {
                        model: User,
                        as: 'buyer',
                        attributes: ['id', 'email', 'full_name']
                    },
                    { model: Order, attributes: ['id', 'order_number', 'status'] }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            return {
                invoices: rows,
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page
            };
        } catch (error) {
            logger.error('Error in getAllInvoices:', error);
            throw error;
        }
    },

    // Thêm phương thức tìm kiếm hóa đơn
    searchInvoices: async (searchParams, page = 1, limit = 10) => {
        try {
            const {
                invoiceNumber,
                orderNumber,
                buyerName,
                buyerEmail,
                fromDate,
                toDate,
                minAmount,
                maxAmount,
                paymentMethod
            } = searchParams;

            const whereClause = {};

            // Lọc theo mã hóa đơn
            if (invoiceNumber) {
                whereClause.invoice_number = { [Op.like]: `%${invoiceNumber}%` };
            }

            // Lọc theo tên người mua
            if (buyerName) {
                whereClause.buyer_name = { [Op.like]: `%${buyerName}%` };
            }

            // Lọc theo email người mua
            if (buyerEmail) {
                whereClause.buyer_email = { [Op.like]: `%${buyerEmail}%` };
            }

            // Lọc theo khoảng thời gian
            if (fromDate && toDate) {
                whereClause.issue_date = {
                    [Op.between]: [new Date(fromDate), new Date(toDate)]
                };
            } else if (fromDate) {
                whereClause.issue_date = { [Op.gte]: new Date(fromDate) };
            } else if (toDate) {
                whereClause.issue_date = { [Op.lte]: new Date(toDate) };
            }

            // Lọc theo khoảng giá trị
            if (minAmount && maxAmount) {
                whereClause.final_price = {
                    [Op.between]: [minAmount, maxAmount]
                };
            } else if (minAmount) {
                whereClause.final_price = { [Op.gte]: minAmount };
            } else if (maxAmount) {
                whereClause.final_price = { [Op.lte]: maxAmount };
            }

            // Lọc theo phương thức thanh toán
            if (paymentMethod) {
                whereClause.payment_method = paymentMethod;
            }

            const offset = (page - 1) * limit;

            // Tìm kiếm hóa đơn với include Order để lọc theo orderNumber
            let orderIncludeOptions = { model: Order, attributes: ['id', 'order_number', 'status'] };

            if (orderNumber) {
                orderIncludeOptions.where = { order_number: { [Op.like]: `%${orderNumber}%` } };
            }

            const { count, rows } = await Invoice.findAndCountAll({
                where: whereClause,
                include: [
                    orderIncludeOptions,
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'email', 'full_name']
                    },
                    {
                        model: User,
                        as: 'buyer',
                        attributes: ['id', 'email', 'full_name']
                    }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            return {
                invoices: rows,
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page
            };
        } catch (error) {
            logger.error('Error in searchInvoices:', error);
            throw error;
        }
    },

    // Thêm phương thức tạo file PDF cho hóa đơn
    // Thêm phương thức tạo file PDF cho hóa đơn
    generateInvoicePDF: async (invoiceId) => {
        try {
            // Lấy thông tin hóa đơn
            const invoice = await InvoiceService.getInvoiceById(invoiceId);
            if (!invoice) {
                throw new Error('Hóa đơn không tồn tại');
            }

            // Tạo đường dẫn và tên file
            const fileName = `invoice-${invoice.invoice_number}.pdf`;
            const invoicesDir = path.join(__dirname, '../public/invoices');

            // Đảm bảo thư mục tồn tại
            if (!fs.existsSync(invoicesDir)) {
                fs.mkdirSync(invoicesDir, { recursive: true });
            }

            const filePath = path.join(invoicesDir, fileName);

            // Khởi tạo document PDF
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
                info: {
                    Title: `Hóa đơn ${invoice.invoice_number}`,
                    Author: 'Fashion Shop',
                    Subject: 'Hóa đơn bán hàng',
                    Producer: 'Fashion Shop',
                    CreationDate: new Date()
                }
            });

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Sử dụng font hệ thống 
            doc.font('Helvetica');

            // Tạo tiêu đề
            doc.fontSize(20).font('Helvetica-Bold').text('HOA DON BAN HANG', { align: 'center' });
            doc.moveDown();

            // Thông tin hóa đơn
            doc.fontSize(12).font('Helvetica').text(`Ma hoa don: ${invoice.invoice_number}`);
            const issueDate = new Date(invoice.issue_date);
            doc.text(`Ngay phat hanh: ${issueDate.getDate()}/${issueDate.getMonth() + 1}/${issueDate.getFullYear()}`);
            doc.text(`Trang thai thanh toan: ${invoice.payment_status === 'completed' ? 'Da thanh toan' : 'Chua thanh toan'}`);
            doc.moveDown();

            // Thông tin người bán (sử dụng thông tin Creator)
            doc.fontSize(14).font('Helvetica-Bold').text('Thong tin nguoi ban');
            if (invoice.Creator) {
                doc.fontSize(12).font('Helvetica').text(`Ten: ${invoice.Creator.firstname} ${invoice.Creator.lastname}`);
                doc.text(`Email: ${invoice.Creator.email}`);
            } else {
                doc.fontSize(12).font('Helvetica').text('Cong ty TNHH Thuong mai Fashion Shop');
            }
            doc.text('Dia chi: 123 Duong ABC, Phuong XYZ, Quan 1, TP. Ho Chi Minh');
            doc.text('So dien thoai: 1900 1234');
            doc.text('MST: 0123456789');
            doc.moveDown();

            // Thông tin người mua
            doc.fontSize(14).font('Helvetica-Bold').text('Thong tin nguoi mua');
            doc.fontSize(12).font('Helvetica').text(`Ten: ${invoice.buyer_name}`);
            doc.text(`Dia chi: ${invoice.buyer_address}`);
            doc.text(`Email: ${invoice.buyer_email}`);
            doc.text(`So dien thoai: ${invoice.buyer_phone}`);
            doc.moveDown();

            // Thông tin đơn hàng
            doc.fontSize(14).font('Helvetica-Bold').text('Chi tiet don hang');
            doc.moveDown();

            // Table header
            const tableTop = doc.y;
            const tableLeft = 50;
            const colWidths = [40, 200, 80, 40, 120];

            doc.font('Helvetica-Bold');
            doc.text('STT', tableLeft, tableTop);
            doc.text('San pham', tableLeft + colWidths[0], tableTop);
            doc.text('Don gia', tableLeft + colWidths[0] + colWidths[1], tableTop, { width: colWidths[2], align: 'right' });
            doc.text('SL', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop, { width: colWidths[3], align: 'center' });
            doc.text('Thanh tien', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop, { width: colWidths[4], align: 'right' });

            // Vẽ đường kẻ dưới header
            doc.moveTo(tableLeft, tableTop + 15)
                .lineTo(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop + 15)
                .stroke();

            let y = tableTop + 25;

            // Table body - Xử lý InvoiceItems
            doc.font('Helvetica');
            if (invoice.InvoiceItems && invoice.InvoiceItems.length > 0) {
                for (let i = 0; i < invoice.InvoiceItems.length; i++) {
                    const item = invoice.InvoiceItems[i];

                    // Kiểm tra nếu sắp hết trang thì tạo trang mới
                    if (y > 700) {
                        doc.addPage();
                        y = 50;
                    }

                    // Truy cập dữ liệu từ quan hệ lồng nhau một cách an toàn
                    let productName = 'San pham khong xac dinh';
                    let size = '';
                    let color = '';

                    if (item.Product) {
                        productName = item.Product.product_name || productName;
                    }

                    if (item.Size) {
                        size = item.Size.size || '';
                    }

                    if (item.Color) {
                        color = item.Color.color || '';
                    }

                    const variantText = size || color ? ` (${size}${color ? ', ' + color : ''})` : '';

                    // Lấy ra giá và số lượng
                    const price = parseFloat(item.price || 0);
                    const quantity = parseInt(item.quantity || 0, 10);
                    const lineTotal = price * quantity;

                    doc.text((i + 1).toString(), tableLeft, y);
                    doc.text(productName + variantText, tableLeft + colWidths[0], y, { width: colWidths[1] });
                    doc.text(price.toLocaleString('vi-VN') + ' d', tableLeft + colWidths[0] + colWidths[1], y, { width: colWidths[2], align: 'right' });
                    doc.text(quantity.toString(), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3], align: 'center' });
                    doc.text(lineTotal.toLocaleString('vi-VN') + ' d', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, { width: colWidths[4], align: 'right' });

                    y += 20;
                }
            } else {
                doc.text('Khong co san pham', tableLeft, y);
                y += 20;
            }

            // Phần tổng - vẽ đường kẻ ngăn cách
            doc.moveTo(tableLeft, y)
                .lineTo(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y)
                .stroke();
            y += 15;

            const summaryColWidth = 200;
            const totalLeft = doc.page.width - summaryColWidth - 50;

            // Chuyển đổi các giá trị tiền từ chuỗi sang số thực
            const originalPrice = parseFloat(invoice.original_price || 0);
            const shippingFee = parseFloat(invoice.shipping_fee || 0);
            const discountAmount = parseFloat(invoice.discount_amount || 0);
            const finalPrice = parseFloat(invoice.final_price || 0);

            doc.font('Helvetica-Bold');
            doc.text('Tam tinh:', totalLeft, y, { width: summaryColWidth - 100, align: 'left' });
            doc.font('Helvetica');
            doc.text(originalPrice.toLocaleString('vi-VN') + ' d', totalLeft + summaryColWidth - 100, y, { width: 100, align: 'right' });
            y += 20;

            if (shippingFee >= 0) {
                doc.font('Helvetica-Bold');
                doc.text('Phi van chuyen:', totalLeft, y, { width: summaryColWidth - 100, align: 'left' });
                doc.font('Helvetica');
                doc.text(shippingFee.toLocaleString('vi-VN') + ' d', totalLeft + summaryColWidth - 100, y, { width: 100, align: 'right' });
                y += 20;
            }

            if (discountAmount >= 0) {
                doc.font('Helvetica-Bold');
                doc.text('Giam gia:', totalLeft, y, { width: summaryColWidth - 100, align: 'left' });
                doc.font('Helvetica');
                doc.text('-' + discountAmount.toLocaleString('vi-VN') + ' d', totalLeft + summaryColWidth - 100, y, { width: 100, align: 'right' });
                y += 20;
            }

            // Vẽ đường kẻ ngăn cách trước tổng cộng
            doc.moveTo(totalLeft, y)
                .lineTo(totalLeft + summaryColWidth, y)
                .stroke();
            y += 10;

            doc.font('Helvetica-Bold');
            doc.text('Tong cong:', totalLeft, y, { width: summaryColWidth - 100, align: 'left' });
            doc.text(finalPrice.toLocaleString('vi-VN') + ' d', totalLeft + summaryColWidth - 100, y, { width: 100, align: 'right' });
            y += 30;

            // Phương thức thanh toán
            let paymentMethodText = 'Khong xac dinh';
            if (invoice.payment_method === 'cash_on_delivery') {
                paymentMethodText = 'Thanh toan khi nhan hang';
            } else if (invoice.payment_method === 'bank_transfer') {
                paymentMethodText = 'Chuyen khoan ngan hang';
            } else if (invoice.payment_method === 'credit_card') {
                paymentMethodText = 'The tin dung';
            } else if (invoice.payment_method === 'momo') {
                paymentMethodText = 'Vi dien tu MoMo';
            } else if (invoice.payment_method === 'zalopay') {
                paymentMethodText = 'ZaloPay';
            }

            doc.font('Helvetica');
            doc.text(`Phuong thuc thanh toan: ${paymentMethodText}`, tableLeft, y);
            y += 20;

            // Thông tin đơn hàng
            if (invoice.Order) {
                doc.text(`Ma don hang: #${invoice.Order.id}`, tableLeft, y);
                y += 20;

                let orderStatus = 'Khong xac dinh';
                if (invoice.Order.status === 'completed') {
                    orderStatus = 'Da hoan thanh';
                } else if (invoice.Order.status === 'processing') {
                    orderStatus = 'Dang xu ly';
                } else if (invoice.Order.status === 'shipped') {
                    orderStatus = 'Dang van chuyen';
                } else if (invoice.Order.status === 'cancelled') {
                    orderStatus = 'Da huy';
                }

                doc.text(`Trang thai don hang: ${orderStatus}`, tableLeft, y);
                y += 20;
            }

            // Ghi chú
            if (invoice.notes) {
                doc.text(`Ghi chu: ${invoice.notes}`, tableLeft, y);
                y += 20;
            }

            // Chữ ký
            y = Math.max(y, 600);
            doc.fontSize(12);

            // Vị trí chữ ký
            const signatureLeft = tableLeft;
            const signatureRight = doc.page.width - 180;

            doc.font('Helvetica-Bold');
            doc.text('Nguoi mua hang', signatureLeft, y, { width: 150, align: 'center' });
            doc.text('Nguoi ban hang', signatureRight, y, { width: 150, align: 'center' });
            doc.moveDown();
            doc.font('Helvetica');
            doc.text('(Ky, ghi ro ho ten)', signatureLeft, y + 20, { width: 150, align: 'center' });
            doc.text('(Ky, dong dau, ghi ro ho ten)', signatureRight, y + 20, { width: 150, align: 'center' });

            // Kết thúc tạo PDF
            doc.end();

            return new Promise((resolve, reject) => {
                stream.on('finish', () => resolve(filePath));
                stream.on('error', reject);
            });
        } catch (error) {
            logger.error('Error in generateInvoicePDF:', error);
            throw error;
        }
    }







};

module.exports = InvoiceService;
