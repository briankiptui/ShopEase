"use strict";

const db = require("../../../database/db");
const crypto = require("crypto");

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function processPayment(orderId, userId, paymentMethod) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [orders] = await connection.query(
            `SELECT id, user_id, total_amount, status
             FROM orders
             WHERE id = ? AND user_id = ?
             FOR UPDATE`,
            [orderId, userId]
        );

        if (orders.length === 0) {
            throw createError("Order not found.", 404);
        }

        const order = orders[0];

        if (order.status !== "pending") {
            throw createError(
                `This order cannot be paid because its status is ${order.status}.`,
                409
            );
        }

        const [existing] = await connection.query(
            `SELECT id, status
             FROM payments
             WHERE order_id = ?
             FOR UPDATE`,
            [orderId]
        );

        if (existing.some(payment => payment.status === "successful")) {
            throw createError("This order has already been paid.", 409);
        }

        // This is a demonstration payment, not a real M-Pesa or card charge.
        const reference =
            "SHOPEASE-" +
            Date.now() +
            "-" +
            crypto.randomBytes(4).toString("hex").toUpperCase();

        const amount = Number(order.total_amount);

        const [result] = await connection.query(
            `INSERT INTO payments
             (order_id, amount, payment_method, transaction_reference, status)
             VALUES (?, ?, ?, ?, 'successful')`,
            [orderId, amount, paymentMethod, reference]
        );

        await connection.query(
            `UPDATE orders
             SET status = 'confirmed'
             WHERE id = ?`,
            [orderId]
        );

        await connection.query(
            `INSERT INTO notifications
             (user_id, order_id, message, type)
             VALUES (?, ?, ?, 'payment')`,
            [
                userId,
                orderId,
                `Payment of KES ${amount.toFixed(2)} received successfully for order #${orderId}. Reference: ${reference}.`
            ]
        );

        await connection.commit();

        return {
            paymentId: result.insertId,
            orderId,
            amount,
            paymentMethod,
            transactionReference: reference,
            status: "successful",
            orderStatus: "confirmed"
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

async function getMyPayments(userId) {
    const [payments] = await db.query(
        `SELECT
            p.id,
            p.order_id,
            p.amount,
            p.payment_method,
            p.transaction_reference,
            p.status,
            p.created_at
         FROM payments p
         INNER JOIN orders o ON o.id = p.order_id
         WHERE o.user_id = ?
         ORDER BY p.created_at DESC`,
        [userId]
    );

    return payments;
}

async function getPaymentById(paymentId, userId) {
    const [payments] = await db.query(
        `SELECT
            p.id,
            p.order_id,
            p.amount,
            p.payment_method,
            p.transaction_reference,
            p.status,
            p.created_at
         FROM payments p
         INNER JOIN orders o ON o.id = p.order_id
         WHERE p.id = ? AND o.user_id = ?`,
        [paymentId, userId]
    );

    if (payments.length === 0) {
        throw createError("Payment record not found.", 404);
    }

    return payments[0];
}

module.exports = {
    processPayment,
    getMyPayments,
    getPaymentById
};
