"use strict";

const db = require("../../../database/db");

const allowedStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled"
];

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function createOrder(userId) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Lock cart products while validating stock.
        const [cartItems] = await connection.query(
            `SELECT
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.stock,
                p.status
             FROM cart_items ci
             INNER JOIN products p ON p.id = ci.product_id
             WHERE ci.user_id = ?
             FOR UPDATE`,
            [userId]
        );

        if (cartItems.length === 0) {
            throw createError("Your shopping cart is empty.", 400);
        }

        let totalAmount = 0;

        for (const item of cartItems) {
            if (item.status !== "active") {
                throw createError(
                    `${item.name} is no longer available.`,
                    400
                );
            }

            if (Number(item.quantity) > Number(item.stock)) {
                throw createError(
                    `Insufficient stock for ${item.name}. Available: ${item.stock}.`,
                    400
                );
            }

            totalAmount += Number(item.price) * Number(item.quantity);
        }

        totalAmount = Number(totalAmount.toFixed(2));

        // Create order.
        const [orderResult] = await connection.query(
            `INSERT INTO orders (user_id, total_amount, status)
             VALUES (?, ?, 'pending')`,
            [userId, totalAmount]
        );

        const orderId = orderResult.insertId;

        for (const item of cartItems) {
            const quantity = Number(item.quantity);
            const price = Number(item.price);

            await connection.query(
                `INSERT INTO order_items
                 (order_id, product_id, product_name, quantity, unit_price)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.product_id,
                    item.name,
                    quantity,
                    price
                ]
            );

            // Reduce stock safely.
            const [stockResult] = await connection.query(
                `UPDATE products
                 SET stock = stock - ?
                 WHERE id = ? AND stock >= ? AND status = 'active'`,
                [
                    quantity,
                    item.product_id,
                    quantity
                ]
            );

            if (stockResult.affectedRows !== 1) {
                throw createError(
                    `Stock changed while placing your order for ${item.name}. Please try again.`,
                    409
                );
            }
        }

        // Clear customer's cart after successful order creation.
        await connection.query(
            "DELETE FROM cart_items WHERE user_id = ?",
            [userId]
        );

        await connection.commit();

        return {
            orderId,
            userId,
            totalAmount,
            status: "pending",
            items: cartItems.map(item => ({
                productId: item.product_id,
                productName: item.name,
                quantity: Number(item.quantity),
                unitPrice: Number(item.price),
                subtotal: Number(
                    (Number(item.quantity) * Number(item.price)).toFixed(2)
                )
            }))
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

async function getMyOrders(userId) {
    const [orders] = await db.query(
        `SELECT id, user_id, total_amount, status, created_at
         FROM orders
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
    );

    return orders;
}

async function getOrderById(orderId, userId, isAdmin = false) {
    let sql = `
        SELECT id, user_id, total_amount, status, created_at
        FROM orders
        WHERE id = ?
    `;

    const params = [orderId];

    if (!isAdmin) {
        sql += " AND user_id = ?";
        params.push(userId);
    }

    const [orders] = await db.query(sql, params);

    if (orders.length === 0) {
        throw createError("Order not found.", 404);
    }

    const order = orders[0];

    const [items] = await db.query(
        `SELECT
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            (quantity * unit_price) AS subtotal
         FROM order_items
         WHERE order_id = ?`,
        [orderId]
    );

    return {
        ...order,
        items
    };
}

async function getAllOrders() {
    const [orders] = await db.query(
        `SELECT
            o.id,
            o.user_id,
            u.full_name AS customer_name,
            u.email AS customer_email,
            o.total_amount,
            o.status,
            o.created_at
         FROM orders o
         INNER JOIN users u ON u.id = o.user_id
         ORDER BY o.created_at DESC`
    );

    return orders;
}

async function updateOrderStatus(orderId, status) {
    if (!allowedStatuses.includes(status)) {
        throw createError("Invalid order status.", 400);
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [orders] = await connection.query(
            `SELECT id, status
             FROM orders
             WHERE id = ?
             FOR UPDATE`,
            [orderId]
        );

        if (orders.length === 0) {
            throw createError("Order not found.", 404);
        }

        const currentStatus = orders[0].status;

        if (currentStatus === "cancelled" && status !== "cancelled") {
            throw createError(
                "A cancelled order cannot be reopened.",
                400
            );
        }

        // Restore stock only when an order is cancelled for the first time.
        if (status === "cancelled" && currentStatus !== "cancelled") {
            const [items] = await connection.query(
                `SELECT product_id, quantity
                 FROM order_items
                 WHERE order_id = ?`,
                [orderId]
            );

            for (const item of items) {
                await connection.query(
                    `UPDATE products
                     SET stock = stock + ?
                     WHERE id = ?`,
                    [item.quantity, item.product_id]
                );
            }
        }

        await connection.query(
            `UPDATE orders
             SET status = ?
             WHERE id = ?`,
            [status, orderId]
        );

        await connection.commit();

        return {
            orderId,
            previousStatus: currentStatus,
            status
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus
};
