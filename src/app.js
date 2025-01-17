require('dotenv').config(); // Load environment variables from .env file

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./configs/swagger');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { sequelize, Product, Color, Size, ProductStock, ProductImage, ProductSize, ProductColor, Address, User, Role, UserRole, Token, Cart } = require('./models');
const { updateIsNewStatus } = require('../src/script/updateIsNewStatus');
const redisClient = require('./configs/redisClient');  // Import Redis client
const rateLimiter = require('./middlewares/rateLimiter'); // Import rate limiting middleware
const userRoute = require('./routes/userRoute'); // Import user routes
const productRoute = require('./routes/productRoute'); // Import product routes
const cartRoute = require('./routes/cartRoute'); // Import cart routes
const reviewRoutes = require('./routes/reviewRoutes');


const app = express();
// Define CORS options
const corsOptions = {
    origin: ['http://localhost:3000', 'https://kltn-1-b.vercel.app'], // Danh sách miền được phép
    methods: 'GET, POST, PUT, DELETE', // Các phương thức HTTP được phép
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'], // Các header được phép
    exposedHeaders: ['x-session-id'], // Các header được "phơi bày" cho client
};


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(cookieParser()); // Parse cookies
// Init middleware
app.use(rateLimiter); // Use rate-limiting middleware for anti-DDoS protection
app.use(morgan('dev')); // Log requests in dev format
app.use(helmet()); // Add security headers to responses
app.use(compression()); // Compress responses for performance
app.use(express.json()); // Parse JSON bodies in incoming requests
app.use(cors(corsOptions)); // Enable CORS with specified options

// Test Redis
app.get('/', async (req, res) => {
    try {
        // Save a message into Redis
        await redisClient.set('message', 'API is running!');

        // Retrieve the message from Redis
        const message = await redisClient.get('message');
        res.send(message); // Send message back in the response
    } catch (err) {
        console.error('Error interacting with Redis:', err);
        res.status(500).send('Something went wrong!');
    }
});

// Use the user routes for all routes starting with /api/users
app.use('/api/users', userRoute);  // Register the user routes here
app.use('/api/products', productRoute);  // Register the product routes here
app.use('/api/carts', cartRoute);  // Register the cart routes here
app.use('/api/reviews', reviewRoutes);


// Database connection check
sequelize.authenticate()
    .then(() => {
        console.log('Database connection successful');
    })
    .catch(err => {
        console.error('Database connection error:', err);
    });

// Sync the database (create tables if they don't exist)
sequelize.sync({ force: false })  // Use `force: false` to avoid data loss
    .then(() => {
        console.log('Tables are created or synchronized!');
    })
    .catch(err => {
        console.error('Error syncing the database:', err);
    });

// Thiết lập cron job chạy lúc 2:00 AM mỗi ngày
cron.schedule('0 2 * * *', () => {
    console.log('Running is_new update cron job...');
    updateIsNewStatus();
});

// Export the app for server use
module.exports = app;
