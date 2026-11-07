"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const PORT = process.env.PORT || process.env.ORDER_SERVICE_PORT || 5004;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        success: true,
        service: "ShopEase Order Service",
        status: "Running"
    });
});

app.use("/api/orders", orderRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Order endpoint not found"
    });
});

app.use((error, req, res, next) => {
    console.error("Order Service Error:", error);

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error"
    });
});

app.listen(PORT, () => {
    console.log("========================================");
    console.log("         SHOPEASE ORDER SERVICE");
    console.log("========================================");
    console.log(`Running on port ${PORT}`);
    console.log(`Orders API: http://localhost:${PORT}/api/orders`);
    console.log("========================================");
});
