"use strict";

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication token required"
        });
    }

    try {
        const token = authorization.split(" ")[1];
        req.user = jwt.verify(token, process.env.JWT_SECRET);

        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Administrator access required"
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};
