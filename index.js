const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting (100 requests per 10 minutes)
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.',
});
app.use(limiter);

// Service Map (Dynamically Forward Requests)
const services = {
    flightservice: process.env.FLIGHT_SERVICE_PATH,
    userservice: process.env.USER_SERVICE_PATH,
    bookingservice: process.env.BOOKING_SERVICE_PATH,
};

// Middleware to dynamically route requests
app.use('/api/v1/:service/*', (req, res, next) => {
    const serviceName = req.params.service;
    const target = services[serviceName];

    if (target) {
        return createProxyMiddleware({
            target,
            changeOrigin: true,
            pathRewrite: (path, req) => {
                return path.replace(`/api/v1/${serviceName}`, '/api/v1');
            },
        })(req, res, next);
    } else {
        return res.status(404).json({ message: 'Service not found' });
    }
});

app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
});
