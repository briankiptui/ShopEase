"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const PORT = process.env.PORT || process.env.NOTIFICATION_SERVICE_PORT || 5006;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        success: true,
        service: "ShopEase Notification Service",
        status: "Running"
    });
});

app.use("/api/notifications", notificationRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Notification endpoint not found"
    });
});

app.use((error, req, res, next) => {
    console.error("Notification Service Error:", error);

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error"
    });
});

app.listen(PORT, () => {
    console.log("========================================");
    console.log("      SHOPEASE NOTIFICATION SERVICE");
    console.log("========================================");
    console.log(`Running on port ${PORT}`);
    console.log(`Notifications API: http://localhost:${PORT}/api/notifications`);
    console.log("========================================");
});
