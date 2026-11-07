"use strict";

const db = require("../../../database/db");

const validId = value => Number.isInteger(Number(value)) && Number(value) > 0;

exports.getAllProducts = async (req, res) => {
    try {
        const [products] = await db.execute(
            `SELECT id, name, description, category, price, stock, image, status, created_at
             FROM products
             WHERE status = 'active'
             ORDER BY created_at DESC`
        );

        return res.json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        console.error("Get products error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve products"
        });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const [products] = await db.execute(
            `SELECT id, name, description, category, price, stock, image, status, created_at
             FROM products
             WHERE id = ? AND status = 'active'`,
            [Number(id)]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.json({
            success: true,
            product: products[0]
        });
    } catch (error) {
        console.error("Get product error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve product"
        });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            price,
            stock,
            image
        } = req.body;

        if (!name || !category || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "Product name, category and price are required"
            });
        }

        const productPrice = Number(price);
        const productStock = stock === undefined ? 0 : Number(stock);

        if (!Number.isFinite(productPrice) || productPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be a valid non-negative number"
            });
        }

        if (!Number.isInteger(productStock) || productStock < 0) {
            return res.status(400).json({
                success: false,
                message: "Stock must be a non-negative whole number"
            });
        }

        const [result] = await db.execute(
            `INSERT INTO products
             (name, description, category, price, stock, image, status)
             VALUES (?, ?, ?, ?, ?, ?, 'active')`,
            [
                name.trim(),
                description || null,
                category.trim(),
                productPrice,
                productStock,
                image || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            productId: result.insertId
        });
    } catch (error) {
        console.error("Create product error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to create product"
        });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const allowedFields = [
            "name",
            "description",
            "category",
            "price",
            "stock",
            "image",
            "status"
        ];

        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                let value = req.body[field];

                if (field === "price") {
                    value = Number(value);
                    if (!Number.isFinite(value) || value < 0) {
                        return res.status(400).json({
                            success: false,
                            message: "Price must be a valid non-negative number"
                        });
                    }
                }

                if (field === "stock") {
                    value = Number(value);
                    if (!Number.isInteger(value) || value < 0) {
                        return res.status(400).json({
                            success: false,
                            message: "Stock must be a non-negative whole number"
                        });
                    }
                }

                if (field === "status" && !["active", "inactive"].includes(value)) {
                    return res.status(400).json({
                        success: false,
                        message: "Status must be active or inactive"
                    });
                }

                if (["name", "category"].includes(field)) {
                    if (typeof value !== "string" || !value.trim()) {
                        return res.status(400).json({
                            success: false,
                            message: `${field} cannot be empty`
                        });
                    }
                    value = value.trim();
                }

                updates.push(`${field} = ?`);
                values.push(value);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one field to update"
            });
        }

        values.push(Number(id));

        const [result] = await db.execute(
            `UPDATE products SET ${updates.join(", ")} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.json({
            success: true,
            message: "Product updated successfully"
        });
    } catch (error) {
        console.error("Update product error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update product"
        });
    }
};

exports.updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const stock = Number(req.body.stock);

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        if (!Number.isInteger(stock) || stock < 0) {
            return res.status(400).json({
                success: false,
                message: "Stock must be a non-negative whole number"
            });
        }

        const [result] = await db.execute(
            "UPDATE products SET stock = ? WHERE id = ?",
            [stock, Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.json({
            success: true,
            message: "Stock updated successfully",
            stock
        });
    } catch (error) {
        console.error("Update stock error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update stock"
        });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const [result] = await db.execute(
            "DELETE FROM products WHERE id = ?",
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error("Delete product error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to delete product"
        });
    }
};
