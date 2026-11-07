"use strict";

const notificationService = require("../services/notificationService");

function validId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await notificationService.getNotifications(
            req.user.id
        );

        res.json({
            success: true,
            count: notifications.length,
            notifications
        });

    } catch (error) {
        next(error);
    }
};

exports.getUnreadCount = async (req, res, next) => {
    try {
        const count = await notificationService.getUnreadCount(
            req.user.id
        );

        res.json({
            success: true,
            unreadCount: count
        });

    } catch (error) {
        next(error);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const id = validId(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID."
            });
        }

        await notificationService.markAsRead(id, req.user.id);

        res.json({
            success: true,
            message: "Notification marked as read."
        });

    } catch (error) {
        next(error);
    }
};

exports.markAllAsRead = async (req, res, next) => {
    try {
        await notificationService.markAllAsRead(req.user.id);

        res.json({
            success: true,
            message: "All notifications marked as read."
        });

    } catch (error) {
        next(error);
    }
};
