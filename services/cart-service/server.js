"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cartRoutes = require("./routes/cartRoutes");

const app = express();
const PORT = process.env.PORT || process.env.CART_SERVICE_PORT || 5003;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        success: true,
        service: "ShopEase Cart Service",
        status: "Running"
    });
});

app.use("/api/cart", cartRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Cart endpoint not found"
    });
});

app.use((error, req, res, next) => {
    console.error("Cart Service Error:", error);

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error"
    });
});

app.listen(PORT, () => {
    console.log("========================================");
    console.log("          SHOPEASE CART SERVICE");
    console.log("========================================");
    console.log(`Running on port ${PORT}`);
    console.log(`Cart API: http://localhost:${PORT}/api/cart`);
    console.log("========================================");
});
