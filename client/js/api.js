"use strict";

const API_BASE = window.SHOP_API_BASE || "http://127.0.0.1:5100/api";

const ShopEaseAPI = {
    async request(path, options = {}) {
        const token = localStorage.getItem("shopEaseToken");

        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("shopEaseToken");
                localStorage.removeItem("shopEaseUser");
            }

            throw new Error(
                data.message || `Request failed (${response.status})`
            );
        }

        return data;
    },

    get(path) {
        return this.request(path);
    },

    post(path, body = {}) {
        return this.request(path, {
            method: "POST",
            body: JSON.stringify(body)
        });
    },

    patch(path, body = {}) {
        return this.request(path, {
            method: "PATCH",
            body: JSON.stringify(body)
        });
    },

    put(path, body = {}) {
        return this.request(path, {
            method: "PUT",
            body: JSON.stringify(body)
        });
    },

    delete(path) {
        return this.request(path, { method: "DELETE" });
    }
};

function getShopEaseUser() {
    try {
        return JSON.parse(
            localStorage.getItem("shopEaseUser") || "null"
        );
    } catch {
        return null;
    }
}

function requireShopEaseLogin() {
    if (!localStorage.getItem("shopEaseToken")) {
        window.location.href = "index.html?page=login";
        return false;
    }

    return true;
}

function shopEaseLogout() {
    localStorage.removeItem("shopEaseToken");
    localStorage.removeItem("shopEaseUser");
    window.location.href = "index.html?page=login";
}

/* Compatibility interface for the original ShopEase homepage */

const ShopAPI = {
    token() {
        return localStorage.getItem("shopEaseToken");
    },

    user() {
        return getShopEaseUser();
    },

    saveSession(data) {
        if (!data || !data.token) {
            throw new Error("Login did not return an authentication token.");
        }

        localStorage.setItem("shopEaseToken", data.token);

        if (data.user) {
            localStorage.setItem(
                "shopEaseUser",
                JSON.stringify(data.user)
            );
        }
    },

    logout() {
        shopEaseLogout();
    },

    products() {
        return ShopEaseAPI.get("/products");
    },

    cart() {
        return ShopEaseAPI.get("/cart");
    },

    addToCart(productId, quantity = 1) {
        return ShopEaseAPI.post("/cart", {
            productId,
            quantity
        });
    },

    updateCart(productId, quantity) {
        return ShopEaseAPI.patch(`/cart/${productId}`, {
            quantity
        });
    },

    removeCartItem(productId) {
        return ShopEaseAPI.delete(`/cart/${productId}`);
    },

    checkout() {
        return ShopEaseAPI.post("/orders/checkout");
    },

    orders() {
        return ShopEaseAPI.get("/orders/my-orders");
    },

    order(orderId) {
        return ShopEaseAPI.get(`/orders/${orderId}`);
    },

    adminOrders() {
        return ShopEaseAPI.get("/orders");
    },

    notifications() {
        return ShopEaseAPI.get("/notifications");
    },

    markNotification(notificationId) {
        return ShopEaseAPI.patch(
            `/notifications/${notificationId}/read`
        );
    },

    markAllNotifications() {
        return ShopEaseAPI.patch("/notifications/read-all");
    },

    login(body) {
        return ShopEaseAPI.post("/users/login", body);
    },

    register(body) {
        return ShopEaseAPI.post("/users/register", body);
    },

    pay(orderId, paymentMethod) {
        return ShopEaseAPI.post(
            `/payments/${orderId}/pay`,
            { paymentMethod }
        );
    },

    createProduct(body) {
        return ShopEaseAPI.post("/products", body);
    }
};
