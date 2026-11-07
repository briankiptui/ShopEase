"use strict";

const db = require("../../../database/db");

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function getCart(userId) {
    const [items] = await db.query(
        `SELECT
            ci.id,
            ci.product_id,
            ci.quantity,
            p.name,
            p.description,
            p.category,
            p.price,
            p.stock,
            p.image,
            (ci.quantity * p.price) AS subtotal
         FROM cart_items ci
         INNER JOIN products p ON p.id = ci.product_id
         WHERE ci.user_id = ?
         ORDER BY ci.created_at DESC`,
        [userId]
    );

    const totalItems = items.reduce(
        (total, item) => total + Number(item.quantity),
        0
    );

    const totalAmount = items.reduce(
        (total, item) => total + Number(item.subtotal),
        0
    );

    return {
        items,
        totalItems,
        totalAmount: Number(totalAmount.toFixed(2))
    };
}

async function addToCart(userId, productId, quantity) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [products] = await connection.query(
            `SELECT id, name, price, stock, status
             FROM products
             WHERE id = ?
             FOR UPDATE`,
            [productId]
        );

        if (products.length === 0 || products[0].status !== "active") {
            throw createError("Product not found or unavailable.", 404);
        }

        const product = products[0];

        const [existingItems] = await connection.query(
            `SELECT id, quantity
             FROM cart_items
             WHERE user_id = ? AND product_id = ?
             FOR UPDATE`,
            [userId, productId]
        );

        const existingQuantity = existingItems.length
            ? Number(existingItems[0].quantity)
            : 0;

        const newQuantity = existingQuantity + quantity;

        if (newQuantity > Number(product.stock)) {
            throw createError(
                `Only ${product.stock} unit(s) of ${product.name} are available.`,
                400
            );
        }

        await connection.query(
            `INSERT INTO cart_items (user_id, product_id, quantity)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE quantity = ?`,
            [userId, productId, newQuantity, newQuantity]
        );

        await connection.commit();

        return {
            productId,
            productName: product.name,
            quantity: newQuantity,
            unitPrice: Number(product.price)
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

async function updateCartItem(userId, productId, quantity) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [products] = await connection.query(
            `SELECT id, name, stock, status
             FROM products
             WHERE id = ?
             FOR UPDATE`,
            [productId]
        );

        if (products.length === 0 || products[0].status !== "active") {
            throw createError("Product is unavailable.", 404);
        }

        const product = products[0];

        const [items] = await connection.query(
            `SELECT id
             FROM cart_items
             WHERE user_id = ? AND product_id = ?
             FOR UPDATE`,
            [userId, productId]
        );

        if (items.length === 0) {
            throw createError("Product is not in your cart.", 404);
        }

        if (quantity > Number(product.stock)) {
            throw createError(
                `Only ${product.stock} unit(s) of ${product.name} are available.`,
                400
            );
        }

        await connection.query(
            `UPDATE cart_items
             SET quantity = ?
             WHERE user_id = ? AND product_id = ?`,
            [quantity, userId, productId]
        );

        await connection.commit();

        return {
            productId,
            productName: product.name,
            quantity
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

async function removeCartItem(userId, productId) {
    const [result] = await db.query(
        `DELETE FROM cart_items
         WHERE user_id = ? AND product_id = ?`,
        [userId, productId]
    );

    if (result.affectedRows === 0) {
        throw createError("Cart item not found.", 404);
    }

    return true;
}

async function clearCart(userId) {
    await db.query(
        "DELETE FROM cart_items WHERE user_id = ?",
        [userId]
    );

    return true;
}

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
};
