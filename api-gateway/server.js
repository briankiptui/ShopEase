
"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 5100;

// Microservice targets
const services = {
    "/api/users": process.env.USER_SERVICE_URL || "http://127.0.0.1:5001",
    "/api/products": process.env.PRODUCT_SERVICE_URL || "http://127.0.0.1:5002",
    "/api/cart": process.env.CART_SERVICE_URL || "http://127.0.0.1:5003",
    "/api/orders": process.env.ORDER_SERVICE_URL || "http://127.0.0.1:5004",
    "/api/payments": process.env.PAYMENT_SERVICE_URL || "http://127.0.0.1:5005",
    "/api/notifications": process.env.NOTIFICATION_SERVICE_URL || "http://127.0.0.1:5006"
};

app.use(cors());

// Gateway health
app.get("/health", (req, res) => {
    res.json({
        success: true,
        service: "ShopEase API Gateway",
        status: "Running"
    });
});

// Gateway information
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to ShopEase API Gateway",
        version: "1.0.0",
        services: Object.keys(services)
    });
});

// Central proxy - preserve the complete original URL
app.use(
    createProxyMiddleware({
        router: (req) => {
            const matchedRoute = Object.keys(services).find(
                route =>
                    req.originalUrl === route ||
                    req.originalUrl.startsWith(route + "/") ||
                    req.originalUrl.startsWith(route + "?")
            );

            if (!matchedRoute) {
                return "http://127.0.0.1:5100";
            }

            return services[matchedRoute];
        },

        changeOrigin: true,
        logger: console,

        on: {
            error: (error, req, res) => {
                console.error("Gateway proxy error:", error.message);

                if (!res.headersSent) {
                    res.status(503).json({
                        success: false,
                        message: "The requested service is unavailable",
                        path: req.originalUrl
                    });
                }
            }
        }
    })
);

// Unknown endpoint
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found",
        requestedUrl: req.originalUrl,
        method: req.method
    });
});

app.listen(PORT, () => {
    console.log("========================================");
    console.log("         SHOPEASE API GATEWAY");
    console.log("========================================");
    console.log(`Gateway running on port ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log("========================================");
});
