"use strict";

const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const {
    authenticate,
    requireAdmin
} = require("../middleware/authMiddleware");

router.use(authenticate);

// Customer routes
router.post("/checkout", orderController.checkout);
router.get("/my-orders", orderController.getMyOrders);
router.get("/:id", orderController.getOrderById);

// Administrator routes
router.get("/", requireAdmin, orderController.getAllOrders);
router.patch("/:id/status", requireAdmin, orderController.updateOrderStatus);

module.exports = router;
