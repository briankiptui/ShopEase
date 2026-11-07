"use strict";

require("dotenv").config();

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
    user: process.env.DB_USER || process.env.MYSQLUSER || "root",
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || "shopease",
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(connection => {
        console.log("ShopEase database connected successfully");
        connection.release();
    })
    .catch(error => {
        console.error("Database connection failed:", error.message);
    });

module.exports = pool;