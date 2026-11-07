"use strict";

const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartController");
const authMiddleware = require("../middleware/authMiddleware");

// All cart operations require an authenticated user.
router.use(authMiddleware);

// GET    /api/cart          Retrieve cart
// POST   /api/cart          Add product
// PATCH  /api/cart/:productId  Update quantity
// DELETE /api/cart/:productId  Remove product
// DELETE /api/cart          Clear cart

router.get("/", cartController.getCart);
router.post("/", cartController.addToCart);
router.patch("/:productId", cartController.updateCartItem);
router.delete("/:productId", cartController.removeCartItem);
router.delete("/", cartController.clearCart);

module.exports = router;
