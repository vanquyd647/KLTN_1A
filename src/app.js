require('dotenv').config();
require('./crons/orderCron');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./configs/swagger');
const logger = require('./configs/winston');  // Winston Logger
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { sequelize } = require('./models');
const redisClient = require('./configs/redisClient');
const rateLimiter = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorMiddleware');
const ensureSession = require('./middlewares/ensureSession');
const userRoute = require('./routes/userRoute');
const productRoute = require('./routes/productRoute');
const cartRoute = require('./routes/cartRoute');
const reviewRoutes = require('./routes/reviewRoutes');
const productsByCategoryRoute = require('./routes/productsByCategoryRoute');
const colorRoutes = require('./routes/colorRoutes');
const orderRoute = require('./routes/orderRoute');
const paymentRoute = require('./routes/paymentRoutes');
const worker = require('./services/orderWorker');
const initRoles = require('./scripts/initRoles');
const initCarriers = require('./scripts/initCarriers');
const setupElasticsearch = require('./scripts/setup-elasticsearch');
const { updateIsNewStatus } = require('./crons/updateIsNewStatus');
const productStockRoutes = require('./routes/productStockRoutes');
const carrierRoutes = require('./routes/CarrierRoute');
const addressRoutes = require('./routes/addressRoute');
const orderEmailRoutes = require('./routes/orderEmailRoutes');
const favoriteRoute = require('./routes/favoriteRoute');
const orderTrackingRoute = require('./routes/orderTrackingRoute');
const couponRoutes = require('./routes/couponRoutes');
const revenueRoutes = require('./routes/revenueRoute');
const { createRevenueTrigger, checkTrigger } = require('./db/triggers');
const client = require('prom-client');

const app = express();

// 🔹 Thiết lập giám sát Prometheus
client.collectDefaultMetrics({ timeout: 5000 });

// Tạo metric custom: Đếm số request HTTP
const httpRequestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

// Thêm hàm kiểm tra trigger vào initializeTriggers
const initializeTriggers = async () => {
    try {
        await createRevenueTrigger();
        const triggers = await checkTrigger();
        logger.info('✅ All triggers initialized successfully', { triggers });
    } catch (error) {
        logger.error('❌ Error initializing triggers:', error);
    }
};

// Middleware để ghi log request vào Prometheus
app.use((req, res, next) => {
    res.on('finish', () => {
        httpRequestCounter.inc({ method: req.method, route: req.path, status_code: res.statusCode });
    });
    next();
});

// Cấu hình Winston + Morgan để log request
const morganFormat = morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
});
app.use(morganFormat);

// Cấu hình CORS
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://kltn-1-b.vercel.app',
        'https://*.ngrok.io',
        'https://*.ngrok-free.app'
    ],
    methods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-session-id',
        'ngrok-skip-browser-warning'
    ],
    exposedHeaders: ['x-session-id'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Bảo mật với Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    frameguard: { action: "sameorigin" },
    referrerPolicy: { policy: "no-referrer" },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    xssFilter: false,
    noSniff: true,
    ieNoOpen: true,
    dnsPrefetchControl: { allow: false },
}));

// Middleware
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(rateLimiter);
app.use(ensureSession);
app.use(compression());
app.use(express.json());
app.use(cors(corsOptions));
app.use(errorHandler);
// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Ghi log khi server khởi động
logger.info('🚀 Server is starting...');

// Khởi tạo database và các bảng
sequelize.authenticate()
    .then(() => {
        logger.info('✅ Database connection successful');
        // Sync database trước
        return sequelize.sync({ force: false });
    })
    .then(() => {
        logger.info('✅ Tables are created or synchronized!');
        // Tạo triggers sau khi đã có bảng
        return initializeTriggers();
    })
    .then(() => {
        // Setup Elasticsearch
        return setupElasticsearch();
    })
    .then(() => {
        logger.info('✅ Elasticsearch setup completed');
        return initRoles();
    })
    .then(() => {
        logger.info('\U0001F527 Roles initialized successfully');
        return initCarriers();
    })
    .then(() => {
        logger.info('\U0001F69A Carriers initialized successfully');
    })
    .catch(err => {
        logger.error('❌ Database/Setup error:', err);
    });

// Kiểm tra Redis và log
app.get('/', async (req, res) => {
    try {
        await redisClient.set('message', 'API is running!');
        const message = await redisClient.get('message');
        logger.info('📩 Fetched message from Redis:', message);
        res.send(message);
    } catch (err) {
        logger.error('❌ Error interacting with Redis:', err);
        res.status(500).send('Something went wrong!');
    }
});

// Endpoint để Prometheus thu thập dữ liệu
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

// Định nghĩa route
app.use('/v1/api/users', userRoute);
app.use('/v1/api/products', productRoute);
app.use('/v1/api/carts', cartRoute);
app.use('/v1/api/reviews', reviewRoutes);
app.use('/v1/api/products-by-category', productsByCategoryRoute);
app.use('/v1/api/colors', colorRoutes);
app.use('/v1/api/orders', orderRoute);
app.use('/v1/api/payments', paymentRoute);
app.use('/v1/api/product-stocks', productStockRoutes);
app.use('/v1/api/carriers', carrierRoutes);
app.use('/v1/api/addresses', addressRoutes);
app.use('/v1/api/orders', orderEmailRoutes);
app.use('/v1/api/favorites', favoriteRoute);
app.use('/v1/api/order-tracking', orderTrackingRoute);
app.use('/v1/api/coupons', couponRoutes);
app.use('/v1/api/revenue', revenueRoutes);

// Schedule Cron job: Update is_new status mỗi ngày lúc 2:00 AM
cron.schedule('0 2 * * *', () => {
    logger.info('🔄 Running is_new update cron job...');
    updateIsNewStatus();
});

// // Khởi tạo dữ liệu roles & carriers nếu chưa có
// (async () => {
//     await initRoles();
//     logger.info('🔧 Roles initialized successfully');
// })();

// (async () => {
//     await initCarriers();
//     logger.info('🚚 Carriers initialized successfully');
// })();

// Khởi động worker và log
logger.info('⚙️ Order worker started...');
worker;

module.exports = app;
