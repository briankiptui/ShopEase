"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = process.env.PORT || process.env.PAYMENT_SERVICE_PORT || 5005;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        success: true,
        service: "ShopEase Payment Service",
        status: "Running",
        mode: "Simulated payments"
    });
});

app.use("/api/payments", paymentRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Payment endpoint not found"
    });
});

app.use((error, req, res, next) => {
    console.error("Payment Service Error:", error);

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error"
    });
});

app.listen(PORT, () => {
    console.log("========================================");
    console.log("        SHOPEASE PAYMENT SERVICE");
    console.log("========================================");
    console.log(`Running on port ${PORT}`);
    console.log(`Payments API: http://localhost:${PORT}/api/payments`);
    console.log("Mode: Simulated payments");
    console.log("========================================");
});
