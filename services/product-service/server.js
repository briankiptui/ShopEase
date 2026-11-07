"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/productRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        success: true,
        service: "Product Service",
        status: "Running"
    });
});

app.use("/api/products", productRoutes);

const PORT = process.env.PORT || process.env.PRODUCT_SERVICE_PORT || 5002;

app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log("     SHOP EASE PRODUCT SERVICE");
    console.log("--------------------------------");
    console.log(`Running on port ${PORT}`);
    console.log(`Products API: http://localhost:${PORT}/api/products`);
    console.log("--------------------------------");
});
