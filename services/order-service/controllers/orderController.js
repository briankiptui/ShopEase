"use strict";

const orderService = require("../services/orderService");

function validId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

exports.checkout = async (req, res, next) => {
    try {
        const order = await orderService.createOrder(req.user.id);

        res.status(201).json({
            success: true,
            message: "Order placed successfully.",
            order
        });

    } catch (error) {
        next(error);
    }
};

exports.getMyOrders = async (req, res, next) => {
    try {
        const orders = await orderService.getMyOrders(req.user.id);

        res.json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        next(error);
    }
};

exports.getOrderById = async (req, res, next) => {
    try {
        const orderId = validId(req.params.id);

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID."
            });
        }

        const order = await orderService.getOrderById(
            orderId,
            req.user.id,
            req.user.role === "admin"
        );

        res.json({
            success: true,
            order
        });

    } catch (error) {
        next(error);
    }
};

exports.getAllOrders = async (req, res, next) => {
    try {
        const orders = await orderService.getAllOrders();

        res.json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        next(error);
    }
};

exports.updateOrderStatus = async (req, res, next) => {
    try {
        const orderId = validId(req.params.id);
        const { status } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID."
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Order status is required."
            });
        }

        const order = await orderService.updateOrderStatus(
            orderId,
            status
        );

        res.json({
            success: true,
            message: "Order status updated successfully.",
            order
        });

    } catch (error) {
        next(error);
    }
};
