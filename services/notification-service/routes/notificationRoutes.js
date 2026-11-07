"use strict";

const express = require("express");
const router = express.Router();

const controller = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", controller.getNotifications);
router.get("/unread-count", controller.getUnreadCount);
router.patch("/read-all", controller.markAllAsRead);
router.patch("/:id/read", controller.markAsRead);

module.exports = router;
