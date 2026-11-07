"use strict";

const money = value =>
    new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        maximumFractionDigits: 2
    }).format(Number(value || 0));

const getList = data => {
    if (Array.isArray(data)) return data;

    return data?.items ||
        data?.products ||
        data?.cart ||
        data?.orders ||
        data?.notifications ||
        data?.payments ||
        [];
};

function showMessage(element, message, type = "error") {
    if (!element) return;

    element.textContent = message;
    element.className = `message show ${type}`;
}

function statusClass(status) {
    const value = String(status || "").toLowerCase();

    if (["successful", "delivered", "confirmed", "active"].includes(value)) {
        return "success";
    }

    if (["failed", "cancelled", "inactive"].includes(value)) {
        return "danger";
    }

    return "warning";
}

function updateHeader() {
    const user = getShopEaseUser();
    const name = user?.fullName || user?.full_name || user?.name || "My Account";

    document.querySelectorAll("[data-user-name]").forEach(el => {
        el.textContent = name;
    });

    document.querySelectorAll("[data-logout]").forEach(el => {
        el.addEventListener("click", shopEaseLogout);
    });
}

async function loadCartCount() {
    const element = document.querySelector("[data-cart-count]");
    if (!element) return;

    if (!localStorage.getItem("shopEaseToken")) {
        element.textContent = "0";
        return;
    }

    try {
        const data = await ShopEaseAPI.get("/cart");
        const items = getList(data);
        const count = items.reduce(
            (sum, item) => sum + Number(item.quantity || 0), 0
        );
        element.textContent = count;
    } catch {
        element.textContent = "0";
    }
}

function cartItems(data) {
    return getList(data);
}

async function renderCart() {
    if (!requireShopEaseLogin()) return;

    const container = document.getElementById("cart-content");

    try {
        const data = await ShopEaseAPI.get("/cart");
        const items = cartItems(data);

        if (!items.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Your cart is empty</h3>
                    <p>Find something you love and add it to your cart.</p>
                    <a class="btn" href="index.html?page=products">Explore products</a>
                </div>`;
            return;
        }

        const total = items.reduce((sum, item) => {
            return sum + Number(item.price || item.unit_price || 0) *
                Number(item.quantity || 0);
        }, 0);

        container.innerHTML = `
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Subtotal</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => {
                            const id = item.productId || item.product_id;
                            const name = item.productName || item.product_name || item.name;
                            const price = Number(item.price || item.unit_price || 0);
                            const quantity = Number(item.quantity || 0);

                            return `
                                <tr>
                                    <td><strong>${escapeHTML(name)}</strong></td>
                                    <td>${money(price)}</td>
                                    <td>
                                        <input type="number" min="1"
                                            max="${Number(item.stock || 999)}"
                                            value="${quantity}"
                                            data-quantity="${id}"
                                            style="width:75px;padding:8px;border:1px solid #e2e8f0;border-radius:8px">
                                    </td>
                                    <td><strong>${money(price * quantity)}</strong></td>
                                    <td>
                                        <button class="btn btn-danger btn-small"
                                            data-remove="${id}">Remove</button>
                                    </td>
                                </tr>`;
                        }).join("")}
                    </tbody>
                </table>
            </div>

            <div style="max-width:380px;margin:25px 0 0 auto">
                <div class="summary-row">
                    <span>Subtotal</span><strong>${money(total)}</strong>
                </div>
                <div class="summary-row">
                    <span>Delivery</span><strong>Calculated at checkout</strong>
                </div>
                <div class="summary-row total">
                    <span>Total</span><span>${money(total)}</span>
                </div>
                <a href="checkout.html" class="btn" style="width:100%;margin-top:15px">
                    Proceed to checkout
                </a>
            </div>`;

        container.querySelectorAll("[data-quantity]").forEach(input => {
            input.addEventListener("change", async () => {
                const id = input.dataset.quantity;
                const quantity = Number(input.value);

                if (!Number.isInteger(quantity) || quantity < 1) {
                    alert("Enter a valid quantity.");
                    return;
                }

                try {
                    await ShopEaseAPI.patch(`/cart/${id}`, { quantity });
                    await renderCart();
                    loadCartCount();
                } catch (error) {
                    alert(error.message);
                }
            });
        });

        container.querySelectorAll("[data-remove]").forEach(button => {
            button.addEventListener("click", async () => {
                try {
                    await ShopEaseAPI.delete(`/cart/${button.dataset.remove}`);
                    await renderCart();
                    loadCartCount();
                } catch (error) {
                    alert(error.message);
                }
            });
        });
    } catch (error) {
        container.innerHTML = `<div class="empty-state">
            <h3>Unable to load your cart</h3>
            <p>${escapeHTML(error.message)}</p>
            <button class="btn" onclick="renderCart()">Try again</button>
        </div>`;
    }
}

async function renderCheckout() {
    if (!requireShopEaseLogin()) return;

    const summary = document.getElementById("checkout-summary");
    const form = document.getElementById("checkout-form");

    try {
        const data = await ShopEaseAPI.get("/cart");
        const items = cartItems(data);

        if (!items.length) {
            summary.innerHTML = `<div class="empty-state">
                <h3>Your cart is empty</h3>
                <a href="index.html?page=products" class="btn">Shop products</a>
            </div>`;
            form.style.display = "none";
            return;
        }

        const total = items.reduce((sum, item) => {
            return sum + Number(item.price || item.unit_price || 0) *
                Number(item.quantity || 0);
        }, 0);

        summary.innerHTML = `
            ${items.map(item => `
                <div class="summary-row">
                    <span>${escapeHTML(item.productName || item.product_name || item.name)}
                     ${item.quantity}</span>
                    <strong>${money(
                        Number(item.price || item.unit_price || 0) *
                        Number(item.quantity || 0)
                    )}</strong>
                </div>
            `).join("")}
            <div class="summary-row total">
                <span>Total</span><span>${money(total)}</span>
            </div>`;

        form.onsubmit = async event => {
            event.preventDefault();

            const button = form.querySelector("button[type=submit]");
            const message = document.getElementById("checkout-message");
            button.disabled = true;
            button.textContent = "Processing...";

            try {
                const order = await ShopEaseAPI.post("/orders/checkout", {});
                const orderId = order.orderId || order.order?.id || order.id;

                if (!orderId) {
                    throw new Error("Order created, but no order ID was returned.");
                }

                const paymentMethod =
                    form.querySelector("[name=paymentMethod]").value;

                await ShopEaseAPI.post(
                    `/payments/${orderId}/pay`,
                    { paymentMethod }
                );

                showMessage(
                    message,
                    "Your order and simulated payment were completed successfully.",
                    "success"
                );

                setTimeout(() => {
                    window.location.href = "orders.html";
                }, 1300);
            } catch (error) {
                showMessage(message, error.message, "error");
                button.disabled = false;
                button.textContent = "Place order";
            }
        };
    } catch (error) {
        summary.innerHTML = `<p>${escapeHTML(error.message)}</p>`;
    }
}

async function renderOrders() {
    if (!requireShopEaseLogin()) return;

    const container = document.getElementById("orders-content");

    try {
        const data = await ShopEaseAPI.get("/orders/my-orders");
        const orders = getList(data);

        if (!orders.length) {
            container.innerHTML = `<div class="empty-state">
                <h3>No orders yet</h3>
                <p>Your orders will appear here after checkout.</p>
                <a class="btn" href="index.html?page=products">Start shopping</a>
            </div>`;
            return;
        }

        container.innerHTML = `
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td>#${order.id}</td>
                                <td>${new Date(order.created_at || order.createdAt).toLocaleDateString()}</td>
                                <td><strong>${money(order.total_amount || order.totalAmount)}</strong></td>
                                <td><span class="status ${statusClass(order.status)}">
                                    ${escapeHTML(order.status)}
                                </span></td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>`;
    } catch (error) {
        container.innerHTML = `<div class="empty-state">
            <h3>Unable to load orders</h3>
            <p>${escapeHTML(error.message)}</p>
            <button class="btn" onclick="renderOrders()">Try again</button>
        </div>`;
    }
}

async function renderAccount() {
    if (!requireShopEaseLogin()) return;

    const container = document.getElementById("account-content");

    try {
        const data = await ShopEaseAPI.get("/users/profile");
        const user = data.user || data.profile || data;

        container.innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <label>Full name</label>
                    <input readonly value="${escapeAttribute(user.fullName || user.full_name || "")}">
                </div>
                <div class="form-group">
                    <label>Email address</label>
                    <input readonly value="${escapeAttribute(user.email || "")}">
                </div>
                <div class="form-group">
                    <label>Phone number</label>
                    <input readonly value="${escapeAttribute(user.phone || "")}">
                </div>
                <div class="form-group">
                    <label>Account role</label>
                    <input readonly value="${escapeAttribute(user.role || "customer")}">
                </div>
            </div>
            <button class="btn btn-secondary" style="margin-top:22px"
                onclick="shopEaseLogout()">Sign out</button>`;
    } catch (error) {
        container.innerHTML = `<p>${escapeHTML(error.message)}</p>`;
    }
}

async function renderNotifications() {
    if (!requireShopEaseLogin()) return;

    const container = document.getElementById("notifications-content");

    try {
        const data = await ShopEaseAPI.get("/notifications");
        const notifications = getList(data);

        if (!notifications.length) {
            container.innerHTML = `<div class="empty-state">
                <h3>You're all caught up</h3>
                <p>Your notifications will appear here.</p>
            </div>`;
            return;
        }

        container.innerHTML = `
            <div style="display:flex;justify-content:flex-end;margin-bottom:15px">
                <button class="btn btn-secondary btn-small" id="read-all">
                    Mark all as read
                </button>
            </div>
            ${notifications.map(item => `
                <div class="notification-item">
                    <div>
                        <strong>${escapeHTML(item.message)}</strong>
                        <p>${new Date(item.created_at || item.createdAt).toLocaleString()}</p>
                        <span class="status ${item.is_read ? "success" : "warning"}">
                            ${item.is_read ? "Read" : "Unread"}
                        </span>
                    </div>
                    ${item.is_read ? "" : `
                        <button class="btn btn-secondary btn-small"
                            data-read="${item.id}">Mark read</button>`}
                </div>
            `).join("")}`;

        document.getElementById("read-all").onclick = async () => {
            try {
                await ShopEaseAPI.patch("/notifications/read-all", {});
                renderNotifications();
            } catch (error) {
                alert(error.message);
            }
        };

        container.querySelectorAll("[data-read]").forEach(button => {
            button.onclick = async () => {
                try {
                    await ShopEaseAPI.patch(
                        `/notifications/${button.dataset.read}/read`, {}
                    );
                    renderNotifications();
                } catch (error) {
                    alert(error.message);
                }
            };
        });
    } catch (error) {
        container.innerHTML = `<p>${escapeHTML(error.message)}</p>`;
    }
}

async function renderAdmin() {
    if (!requireShopEaseLogin()) return;

    const user = getShopEaseUser();

    if (user?.role !== "admin") {
        document.getElementById("admin-content").innerHTML = `
            <div class="empty-state">
                <h3>Administrator access required</h3>
                <p>This area is only available to administrator accounts.</p>
            </div>`;
        return;
    }

    const container = document.getElementById("admin-content");

    try {
        const [productData, orderData] = await Promise.all([
            ShopEaseAPI.get("/products"),
            ShopEaseAPI.get("/orders")
        ]);

        const products = getList(productData);
        const orders = getList(orderData);

        container.innerHTML = `
            <div class="card-grid">
                <div class="metric-card">
                    <span>Total products</span>
                    <strong>${products.length}</strong>
                </div>
                <div class="metric-card">
                    <span>Total orders</span>
                    <strong>${orders.length}</strong>
                </div>
                <div class="metric-card">
                    <span>Pending orders</span>
                    <strong>${orders.filter(o => o.status === "pending").length}</strong>
                </div>
            </div>

            <div class="panel" style="margin-bottom:25px">
                <h2>Add a product</h2>
                <div id="admin-message" class="message"></div>
                <form id="product-form" class="form-grid">
                    <div class="form-group">
                        <label>Product name</label>
                        <input name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <input name="category" required>
                    </div>
                    <div class="form-group">
                        <label>Price (KES)</label>
                        <input name="price" type="number" min="0" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Stock quantity</label>
                        <input name="stock" type="number" min="0" step="1" value="0" required>
                    </div>
                    <div class="form-group full">
                        <label>Description</label>
                        <textarea name="description" rows="3"></textarea>
                    </div>
                    <div class="form-group full">
                        <button class="btn" type="submit">Add product</button>
                    </div>
                </form>
            </div>

            <div class="panel" style="margin-bottom:25px">
                <h2>Product management</h2>
                <div class="table-wrap">
                    <table>
                        <thead><tr>
                            <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Action</th>
                        </tr></thead>
                        <tbody>
                            ${products.map(product => `
                                <tr>
                                    <td><strong>${escapeHTML(product.name)}</strong></td>
                                    <td>${escapeHTML(product.category || "")}</td>
                                    <td>${money(product.price)}</td>
                                    <td>${product.stock}</td>
                                    <td><button class="btn btn-danger btn-small"
                                        data-delete-product="${product.id}">Delete</button></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="panel">
                <h2>Order management</h2>
                <div class="table-wrap">
                    <table>
                        <thead><tr>
                            <th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Update status</th>
                        </tr></thead>
                        <tbody>
                            ${orders.map(order => `
                                <tr>
                                    <td>#${order.id}</td>
                                    <td>${escapeHTML(order.full_name || order.customer_name || order.user_id || "")}</td>
                                    <td>${money(order.total_amount)}</td>
                                    <td><span class="status ${statusClass(order.status)}">${escapeHTML(order.status)}</span></td>
                                    <td>
                                        <select data-order-status="${order.id}"
                                            style="padding:8px;border:1px solid #e2e8f0;border-radius:8px">
                                            ${["pending","confirmed","processing","shipped","delivered","cancelled"]
                                                .map(status => `<option value="${status}" ${status === order.status ? "selected" : ""}>${status}</option>`)
                                                .join("")}
                                        </select>
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>`;

        document.getElementById("product-form").onsubmit = async event => {
            event.preventDefault();

            const form = event.currentTarget;
            const values = Object.fromEntries(new FormData(form).entries());

            try {
                await ShopEaseAPI.post("/products", {
                    ...values,
                    price: Number(values.price),
                    stock: Number(values.stock)
                });

                alert("Product added successfully.");
                renderAdmin();
            } catch (error) {
                showMessage(
                    document.getElementById("admin-message"),
                    error.message
                );
            }
        };

        container.querySelectorAll("[data-delete-product]").forEach(button => {
            button.onclick = async () => {
                if (!confirm("Delete this product?")) return;

                try {
                    await ShopEaseAPI.delete(
                        `/products/${button.dataset.deleteProduct}`
                    );
                    renderAdmin();
                } catch (error) {
                    alert(error.message);
                }
            };
        });

        container.querySelectorAll("[data-order-status]").forEach(select => {
            select.onchange = async () => {
                try {
                    await ShopEaseAPI.patch(
                        `/orders/${select.dataset.orderStatus}/status`,
                        { status: select.value }
                    );
                    alert("Order status updated.");
                } catch (error) {
                    alert(error.message);
                    renderAdmin();
                }
            };
        });
    } catch (error) {
        container.innerHTML = `<div class="empty-state">
            <h3>Unable to load administrator dashboard</h3>
            <p>${escapeHTML(error.message)}</p>
        </div>`;
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function escapeAttribute(value) {
    return escapeHTML(value);
}

document.addEventListener("DOMContentLoaded", () => {
    updateHeader();
    loadCartCount();

    const page = document.body.dataset.page;

    const pages = {
        cart: renderCart,
        checkout: renderCheckout,
        orders: renderOrders,
        account: renderAccount,
        notifications: renderNotifications,
        admin: renderAdmin
    };

    if (pages[page]) pages[page]();
});
