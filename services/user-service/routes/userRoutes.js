"use strict";

const express = require("express");
const router = express.Router();

const controller = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/profile", authMiddleware, controller.profile);

module.exports = router;