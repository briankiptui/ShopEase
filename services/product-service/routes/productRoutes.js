"use strict";

const express = require("express");
const router = express.Router();

const controller = require("../controllers/productController");
const adminMiddleware = require("../middleware/adminMiddleware");

// Public catalogue routes
router.get("/", controller.getAllProducts);
router.get("/:id", controller.getProductById);

// Administrator-only routes
router.post("/", adminMiddleware, controller.createProduct);
router.put("/:id", adminMiddleware, controller.updateProduct);
router.patch("/:id/stock", adminMiddleware, controller.updateStock);
router.delete("/:id", adminMiddleware, controller.deleteProduct);

module.exports = router;
