"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        success: true,
        service: "User Service",
        status: "Running"
    });
});

app.use("/api/users", userRoutes);

const PORT = process.env.PORT || process.env.USER_SERVICE_PORT || 5001;

app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log("       SHOP EASE USER SERVICE");
    console.log("--------------------------------");
    console.log(`Running on port ${PORT}`);
    console.log("--------------------------------");
});