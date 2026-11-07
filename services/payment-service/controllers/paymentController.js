"use strict";

const paymentService = require("../services/paymentService");

function validId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

exports.processPayment = async (req, res, next) => {
    try {
        const orderId = validId(req.params.orderId);
        const { paymentMethod } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID."
            });
        }

        if (!["mpesa", "card"].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Choose mpesa or card as the payment method."
            });
        }

        const payment = await paymentService.processPayment(
            orderId,
            req.user.id,
            paymentMethod
        );

        res.status(201).json({
            success: true,
            message: "Simulated payment completed successfully.",
            payment
        });

    } catch (error) {
        next(error);
    }
};

exports.getMyPayments = async (req, res, next) => {
    try {
        const payments = await paymentService.getMyPayments(req.user.id);

        res.json({
            success: true,
            count: payments.length,
            payments
        });

    } catch (error) {
        next(error);
    }
};

exports.getPaymentById = async (req, res, next) => {
    try {
        const paymentId = validId(req.params.paymentId);

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment ID."
            });
        }

        const payment = await paymentService.getPaymentById(
            paymentId,
            req.user.id
        );

        res.json({
            success: true,
            payment
        });

    } catch (error) {
        next(error);
    }
};
