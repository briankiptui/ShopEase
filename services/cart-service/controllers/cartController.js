"use strict";

const cartService = require("../services/cartService");

function getPositiveInteger(value) {
    const number = Number(value);

    if (!Number.isInteger(number) || number <= 0) {
        return null;
    }

    return number;
}

exports.getCart = async (req, res, next) => {
    try {
        const cart = await cartService.getCart(req.user.id);

        res.json({
            success: true,
            message: "Cart retrieved successfully.",
            cart
        });

    } catch (error) {
        next(error);
    }
};

exports.addToCart = async (req, res, next) => {
    try {
        const productId = getPositiveInteger(req.body.productId);
        const quantity = getPositiveInteger(req.body.quantity ?? 1);

        if (!productId || !quantity) {
            return res.status(400).json({
                success: false,
                message: "A valid productId and quantity are required."
            });
        }

        const item = await cartService.addToCart(
            req.user.id,
            productId,
            quantity
        );

        res.status(201).json({
            success: true,
            message: "Product added to cart successfully.",
            item
        });

    } catch (error) {
        next(error);
    }
};

exports.updateCartItem = async (req, res, next) => {
    try {
        const productId = getPositiveInteger(req.params.productId);
        const quantity = getPositiveInteger(req.body.quantity);

        if (!productId || !quantity) {
            return res.status(400).json({
                success: false,
                message: "A valid product ID and quantity are required."
            });
        }

        const item = await cartService.updateCartItem(
            req.user.id,
            productId,
            quantity
        );

        res.json({
            success: true,
            message: "Cart quantity updated successfully.",
            item
        });

    } catch (error) {
        next(error);
    }
};

exports.removeCartItem = async (req, res, next) => {
    try {
        const productId = getPositiveInteger(req.params.productId);

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID."
            });
        }

        await cartService.removeCartItem(req.user.id, productId);

        res.json({
            success: true,
            message: "Product removed from cart."
        });

    } catch (error) {
        next(error);
    }
};

exports.clearCart = async (req, res, next) => {
    try {
        await cartService.clearCart(req.user.id);

        res.json({
            success: true,
            message: "Shopping cart cleared successfully."
        });

    } catch (error) {
        next(error);
    }
};
