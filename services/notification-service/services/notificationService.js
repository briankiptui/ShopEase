"use strict";

const db = require("../../../database/db");

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function getNotifications(userId) {
    const [notifications] = await db.query(
        `SELECT
            id,
            user_id,
            order_id,
            message,
            type,
            is_read,
            created_at
         FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
    );

    return notifications;
}

async function getUnreadCount(userId) {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS unreadCount
         FROM notifications
         WHERE user_id = ? AND is_read = FALSE`,
        [userId]
    );

    return Number(rows[0].unreadCount);
}

async function markAsRead(id, userId) {
    const [result] = await db.query(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE id = ? AND user_id = ?`,
        [id, userId]
    );

    if (result.affectedRows === 0) {
        const [rows] = await db.query(
            `SELECT id FROM notifications
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        if (rows.length === 0) {
            throw createError("Notification not found.", 404);
        }
    }

    return true;
}

async function markAllAsRead(userId) {
    await db.query(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE user_id = ? AND is_read = FALSE`,
        [userId]
    );

    return true;
}

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
