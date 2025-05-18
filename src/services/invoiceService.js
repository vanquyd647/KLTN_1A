const { sequelize } = require('../models');
const { Order, OrderDetails, OrderItem, Invoice, InvoiceItem, User, Payment, Product, Size, Color } = require('../models');
const logger = require('../configs/winston');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const FONTS = {
    Roboto: {
        normal: path.join(__dirname, '../../fonts/Roboto-Regular.ttf'),
        bold: path.join(__dirname, '../../fonts/Roboto-Bold.ttf'),
        italic: path.join(__dirname, '../../fonts/Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, '../../fonts/Roboto-BoldItalic.ttf')
    }
};

const InvoiceService = {
    // Tạo hóa đơn từ đơn hàng đã hoàn thành
    createInvoice: async (orderId, creatorId, notes = null) => {
        console.log('orderId:', orderId); // Debugging log
        console.log('creatorId:', creatorId); // Debugging log
        console.log('notes:', notes); // Debugging log
        console.log('OrderService.createInvoice()'); // Debugging log
        const t = await sequelize.transaction();
        let newInvoice;

        try {
            // Kiểm tra đơn hàng tồn tại và đã hoàn thành
            const order = await Order.findByPk(orderId, {
                include: [
                    {
                        model: OrderDetails,
                        as: 'orderDetailss',
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

            // Kiểm tra và log thông tin orderDetailss để debug
            console.log('OrderDetails exists:', !!order.orderDetailss);
            if (order.orderDetailss) {
                console.log('OrderDetails data:', {
                    name: order.orderDetailss.name,
                    email: order.orderDetailss.email,
                    phone: order.orderDetailss.phone
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
            if (order.orderDetailss && order.orderDetailss.length > 0) {
                buyerName = order.orderDetailss[0].name;
                buyerEmail = order.orderDetailss[0].email;
                buyerPhone = order.orderDetailss[0].phone;
                buyerAddress = `${order.orderDetailss[0].street || ''}, ${order.orderDetailss[0].ward || ''}, ${order.orderDetailss[0].district || ''}, ${order.orderDetailss[0].city || ''}, ${order.orderDetailss[0].country || ''}`;
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
        console.log('invoiceId:', invoiceId); // Debugging log
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
    generateInvoicePDF: async (invoiceId, creator_id, order_id) => {
        console.log('Service - Starting generateInvoicePDF with params:', {
            invoiceId,
            creator_id,
            order_id
        });

        try {
            const numericOrderId = parseInt(order_id, 10);
            const numericInvoiceId = parseInt(invoiceId, 10);

            let invoice = null;

            // Nếu có order_id hợp lệ, thử tạo hóa đơn mới trước
            if (!isNaN(numericOrderId)) {
                try {
                    // Kiểm tra xem đã có hóa đơn cho đơn hàng này chưa
                    const existingInvoice = await Invoice.findOne({
                        where: { order_id: numericOrderId }
                    });

                    if (existingInvoice) {
                        invoice = await InvoiceService.getInvoiceById(existingInvoice.id);
                        console.log('Found existing invoice:', invoice);
                    } else {
                        // Tạo hóa đơn mới nếu chưa có
                        invoice = await InvoiceService.createInvoice(numericOrderId, creator_id);
                        console.log('Created new invoice:', invoice);
                    }
                } catch (error) {
                    console.error('Error creating/finding invoice:', error);
                    throw new Error(`Không thể tạo/tìm hóa đơn: ${error.message}`);
                }
            }

            // Nếu có invoiceId hợp lệ và chưa có invoice, thử tìm theo invoiceId
            if (!invoice && !isNaN(numericInvoiceId)) {
                invoice = await InvoiceService.getInvoiceById(numericInvoiceId);
                console.log('Found invoice by ID:', invoice);
            }

            // Nếu vẫn không tìm thấy hóa đơn
            if (!invoice) {
                throw new Error('Không thể tìm thấy hoặc tạo hóa đơn');
            }

            // Tạo đường dẫn và tên file
            const fileName = `invoice-${invoice.invoice_number}.pdf`;
            const invoicesDir = path.join(__dirname, '../public/invoices');

            // Đảm bảo thư mục tồn tại
            if (!fs.existsSync(invoicesDir)) {
                fs.mkdirSync(invoicesDir, { recursive: true });
            }

            const filePath = path.join(invoicesDir, fileName);

            // Khởi tạo document PDF với font Roboto
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

            // Đăng ký fonts
            doc.registerFont('Roboto', FONTS.Roboto.normal);
            doc.registerFont('Roboto-Bold', FONTS.Roboto.bold);

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Sử dụng font mặc định là Roboto
            doc.font('Roboto');

            // Header
            doc.image(path.join(__dirname, '../public/images/logo.png'), 50, 45, { width: 100 })
                .fontSize(20)
                .font('Roboto-Bold')
                .text('FASHION SHOP', 160, 55)
                .fontSize(10)
                .font('Roboto')
                .text('Website: www.kltn-1-b.vercel.app/', 160, 80)
                .text('Email: contact@fashionshop.com', 160, 95)
                .text('Hotline: 1900 xxxx', 160, 110);

            // Vẽ đường kẻ ngang
            doc.moveTo(50, 140)
                .lineTo(550, 140)
                .stroke();

            // Tiêu đề
            doc.fontSize(20)
                .font('Roboto-Bold')
                .text('HÓA ĐƠN BÁN HÀNG', 50, 160, { align: 'center', width: 500 });

            // Thông tin hóa đơn
            doc.fontSize(12)
                .font('Roboto')
                .text(`Mã hóa đơn: ${invoice.invoice_number}`, 50, 200);
            const issueDate = new Date(invoice.issue_date);
            doc.text(`Ngày phát hành: ${issueDate.getDate()}/${issueDate.getMonth() + 1}/${issueDate.getFullYear()}`, 50);
            doc.text(`Trạng thái thanh toán: ${invoice.payment_status === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán'}`, 50);

            // Thông tin người bán
            doc.moveDown();
            doc.fontSize(14)
                .font('Roboto-Bold')
                .text('Thông tin người bán', 50);

            doc.fontSize(12)
                .font('Roboto')
                .text('Tên: Fashion Shop', 50)
                .text('Địa chỉ: 123 Đường ABC, Phường XYZ, Quận 1, TP. Hồ Chí Minh', 50)
                .text('Số điện thoại: 0999 999 999', 50)
                .text('MST: xxxxxxxxxx', 50);

            // Thông tin người mua
            doc.moveDown();
            doc.fontSize(14)
                .font('Roboto-Bold')
                .text('Thông tin người mua', 50);

            doc.fontSize(12)
                .font('Roboto')
                .text(`Tên: ${invoice.buyer_name}`, 50)
                .text(`Địa chỉ: ${invoice.buyer_address}`, 50)
                .text(`Email: ${invoice.buyer_email}`, 50)
                .text(`Số điện thoại: ${invoice.buyer_phone}`, 50);

            // Thông tin đơn hàng
            doc.moveDown();
            doc.fontSize(14)
                .font('Roboto-Bold')
                .text('Chi tiết đơn hàng', 50);
            doc.moveDown();

            // Table header
            const tableTop = doc.y;
            const tableLeft = 50;
            const colWidths = [40, 200, 80, 40, 120];

            doc.font('Roboto-Bold');
            doc.text('STT', tableLeft, tableTop);
            doc.text('Sản phẩm', tableLeft + colWidths[0], tableTop);
            doc.text('Đơn giá', tableLeft + colWidths[0] + colWidths[1], tableTop,
                { width: colWidths[2], align: 'right' });
            doc.text('SL', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop,
                { width: colWidths[3], align: 'center' });
            doc.text('Thành tiền', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop,
                { width: colWidths[4], align: 'right' });

            // Vẽ đường kẻ dưới header
            doc.moveTo(tableLeft, tableTop + 15)
                .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 15)
                .stroke();

            let y = tableTop + 25;

            // Table body
            doc.font('Roboto');
            const processedItems = new Map();

            if (invoice.InvoiceItems && invoice.InvoiceItems.length > 0) {
                // Gộp các item giống nhau
                for (const item of invoice.InvoiceItems) {
                    const productName = item.Product ? item.Product.product_name : 'Sản phẩm không xác định';
                    const size = item.Size ? item.Size.size : '';
                    const color = item.Color ? item.Color.color : '';
                    const itemKey = `${productName}-${size}-${color}`;
                    const price = parseFloat(item.price || 0);
                    const quantity = parseInt(item.quantity || 0, 10);

                    if (processedItems.has(itemKey)) {
                        const existingItem = processedItems.get(itemKey);
                        existingItem.quantity += quantity;
                        existingItem.lineTotal += price * quantity;
                    } else {
                        processedItems.set(itemKey, {
                            productName,
                            size,
                            color,
                            price,
                            quantity,
                            lineTotal: price * quantity
                        });
                    }
                }

                // Render các item đã gộp
                let index = 1;
                for (const [_, item] of processedItems) {
                    if (y > 700) {
                        doc.addPage();
                        y = 50;
                    }

                    const variantText = item.size || item.color ?
                        ` (${item.size}${item.color ? ', ' + item.color : ''})` : '';
                    const productFullName = item.productName + variantText;

                    const textHeight = doc.heightOfString(productFullName, {
                        width: colWidths[1]
                    });

                    const lineHeight = Math.max(textHeight, 20);

                    doc.text(index.toString(), tableLeft, y);
                    doc.text(productFullName, tableLeft + colWidths[0], y, { width: colWidths[1] });
                    doc.text(item.price.toLocaleString('vi-VN') + ' đ',
                        tableLeft + colWidths[0] + colWidths[1], y,
                        { width: colWidths[2], align: 'right' });
                    doc.text(item.quantity.toString(),
                        tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y,
                        { width: colWidths[3], align: 'center' });
                    doc.text(item.lineTotal.toLocaleString('vi-VN') + ' đ',
                        tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y,
                        { width: colWidths[4], align: 'right' });

                    y += lineHeight + 10;
                    index++;
                }
            } else {
                doc.text('Không có sản phẩm', tableLeft, y);
                y += 20;
            }

            // Phần tổng
            doc.moveTo(tableLeft, y)
                .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), y)
                .stroke();
            y += 15;

            const summaryColWidth = 250;
            const totalLeft = doc.page.width - summaryColWidth - 50;

            const originalPrice = parseFloat(invoice.original_price || 0);
            const shippingFee = parseFloat(invoice.shipping_fee || 0);
            const discountAmount = parseFloat(invoice.discount_amount || 0);
            const finalPrice = parseFloat(invoice.final_price || 0);

            // Tổng tiền
            doc.font('Roboto-Bold')
                .text('Tạm tính:', totalLeft, y, { width: summaryColWidth - 100, align: 'left' });
            doc.font('Roboto')
                .text(originalPrice.toLocaleString('vi-VN') + ' đ',
                    totalLeft + summaryColWidth - 100, y,
                    { width: 100, align: 'right' });
            y += 20;

            if (shippingFee > 0) {
                doc.font('Roboto-Bold')
                    .text('Phí vận chuyển:', totalLeft, y, { width: summaryColWidth - 100, align: 'left' });
                doc.font('Roboto')
                    .text(shippingFee.toLocaleString('vi-VN') + ' đ',
                        totalLeft + summaryColWidth - 100, y,
                        { width: 100, align: 'right' });
                y += 20;
            }

            if (discountAmount > 0) {
                doc.font('Roboto-Bold')
                    .text('Giảm giá:', totalLeft, y, { width: summaryColWidth - 100, align: 'left' });
                doc.font('Roboto')
                    .text(discountAmount.toLocaleString('vi-VN') + ' đ',
                        totalLeft + summaryColWidth - 100, y,
                        { width: 100, align: 'right' });
                y += 20;
            }

            // Vẽ đường kẻ trước tổng cộng
            doc.moveTo(totalLeft, y)
                .lineTo(totalLeft + summaryColWidth, y)
                .stroke();
            y += 10;

            // Tổng cộng
            doc.font('Roboto-Bold')
                .text('Tổng cộng:', totalLeft, y, { width: summaryColWidth - 100, align: 'left' })
                .text(finalPrice.toLocaleString('vi-VN') + ' đ',
                    totalLeft + summaryColWidth - 100, y,
                    { width: 100, align: 'right' });
            y += 30;

            // Phương thức thanh toán
            const paymentMethods = {
                cash_on_delivery: 'Thanh toán khi nhận hàng',
                bank_transfer: 'Chuyển khoản ngân hàng',
                credit_card: 'Thẻ tín dụng',
                momo: 'Ví điện tử MoMo',
                payos: 'PayOS'
            };

            doc.font('Roboto')
                .text(`Phương thức thanh toán: ${paymentMethods[invoice.payment_method] || 'Không xác định'}`,
                    tableLeft, y);
            y += 20;

            // Ghi chú
            if (invoice.notes) {
                doc.text(`Ghi chú: ${invoice.notes}`, tableLeft, y);
                y += 20;
            }

            // Chữ ký
            y = Math.max(y, 600);
            doc.fontSize(12);

            const signatureLeft = tableLeft;
            const signatureRight = doc.page.width - 180;

            doc.font('Roboto-Bold')
                .text('Người mua hàng', signatureLeft, y, { width: 150, align: 'center' })
                .text('Người bán hàng', signatureRight, y, { width: 150, align: 'center' });
            doc.moveDown();

            doc.font('Roboto')
                .text('(Ký, ghi rõ họ tên)', signatureLeft, y + 20, { width: 150, align: 'center' })
                .text('(Ký, đóng dấu, ghi rõ họ tên)', signatureRight, y + 20, { width: 150, align: 'center' });

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
