"use strict";

const express = require("express");
const router = express.Router();

const controller = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/:orderId/pay", controller.processPayment);
router.get("/my-payments", controller.getMyPayments);
router.get("/:paymentId", controller.getPaymentById);

module.exports = router;
