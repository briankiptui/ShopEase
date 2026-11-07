"use strict";

const app = document.getElementById("app");
let currentProducts = [];
let currentCart = [];

const page = new URLSearchParams(location.search).get("page") || "home";

function money(value) {
    return "KES " + Number(value || 0).toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function toast(message) {
    const element = document.getElementById("toast");
    element.textContent = message;
    element.classList.add("show");
    setTimeout(() => element.classList.remove("show"), 3000);
}

function requireLogin() {
    if (!ShopAPI.token()) {
        location.href = "?page=login";
        return false;
    }
    return true;
}

function updateHeader() {
    const user = ShopAPI.user();
    const account = document.getElementById("account-link");

    if (user) {
        account.textContent = user.fullName || user.full_name || "My Account";
        account.href = "?page=account";
    } else {
        account.textContent = "Sign In";
        account.href = "?page=login";
    }

    if (ShopAPI.token()) {
        ShopAPI.cart()
            .then(data => {
                document.getElementById("cart-count").textContent =
                    data.cart?.totalItems || 0;
            })
            .catch(() => {});
    }
}

function pageTitle(title, subtitle = "") {
    return `
        <div class="section-heading">
            <div>
                <h2>${title}</h2>
                <p>${subtitle}</p>
            </div>
        </div>`;
}

function productCard(product) {
    const icons = {
        Electronics: "",
        Fashion: "",
        Accessories: ""
    };

    return `
        <article class="product-card">
            <div class="product-image">${icons[product.category] || ""}</div>
            <div class="product-info">
                <span class="product-category">${escapeHTML(product.category || "General")}</span>
                <h3>${escapeHTML(product.name)}</h3>
                <p class="product-description">${escapeHTML(product.description || "Discover this product at ShopEase.")}</p>
                <div class="product-bottom">
                    <span class="product-price">${money(product.price)}</span>
                    <button class="btn btn-small" data-add="${product.id}">Add to cart</button>
                </div>
            </div>
        </article>`;
}

async function loadHome() {
    const data = await ShopAPI.products();
    currentProducts = data.products || [];

    app.innerHTML = `
        <div class="page-wrap">
            <section class="hero">
                <div class="hero-content">
                    <span class="eyebrow">Your favourite shopping destination</span>
                    <h1>Everything you need, all in one place.</h1>
                    <p>Discover great products, enjoy a simple shopping experience and get more value with every purchase.</p>
                    <a href="?page=products" class="btn btn-light">Explore Products </a>
                </div>
                <div class="hero-decoration"></div>
            </section>

            ${pageTitle("Shop by category", "Find exactly what you're looking for.")}

            <div class="category-grid">
                <a href="?page=products&category=Electronics" class="category-card"><span class="category-icon"></span>Electronics</a>
                <a href="?page=products&category=Fashion" class="category-card"><span class="category-icon"></span>Fashion</a>
                <a href="?page=products&category=Accessories" class="category-card"><span class="category-icon"></span>Accessories</a>
                <a href="?page=products" class="category-card"><span class="category-icon"></span>All Products</a>
            </div>

            ${pageTitle("Featured products", "Handpicked products for your everyday needs.")}

            <div class="product-grid">
                ${currentProducts.slice(0, 4).map(productCard).join("")}
            </div>

            <div style="text-align:center;margin-top:28px">
                <a class="btn btn-dark" href="?page=products">View all products</a>
            </div>
        </div>`;
}

async function loadProducts() {
    const data = await ShopAPI.products();
    currentProducts = data.products || [];

    app.innerHTML = `
        <div class="page-wrap">
            ${pageTitle("Explore our products", "Browse our collection and find something you'll love.")}
            <div class="toolbar">
                <input id="product-search" placeholder="Search products by name or description...">
                <select id="category-filter">
                    <option value="">All categories</option>
                    ${[...new Set(currentProducts.map(p => p.category).filter(Boolean))]
                        .map(c => `<option>${escapeHTML(c)}</option>`).join("")}
                </select>
            </div>
            <div class="product-grid" id="product-results">
                ${currentProducts.map(productCard).join("")}
            </div>
        </div>`;

    const search = document.getElementById("product-search");
    const category = document.getElementById("category-filter");

    const filter = () => {
        const term = search.value.toLowerCase();
        const selected = category.value;

        const filtered = currentProducts.filter(p =>
            (p.name + " " + (p.description || "")).toLowerCase().includes(term) &&
            (!selected || p.category === selected)
        );

        document.getElementById("product-results").innerHTML =
            filtered.length ? filtered.map(productCard).join("") :
            `<div class="empty-state">No products match your search.</div>`;
    };

    search.addEventListener("input", filter);
    category.addEventListener("change", filter);

    const requestedCategory = new URLSearchParams(location.search).get("category");
    if (requestedCategory) {
        category.value = requestedCategory;
        filter();
    }
}

function loadLogin() {
    app.innerHTML = `
        <div class="page-wrap">
            <form class="auth-wrap" id="login-form">
                <span class="eyebrow">Welcome back</span>
                <h1>Sign in to ShopEase</h1>
                <p>Access your account and continue shopping.</p>

                <div class="form-group">
                    <label>Email address</label>
                    <input type="email" name="email" required placeholder="you@example.com">
                </div>

                <div class="form-group">
                    <label>Password</label>
                    <input type="password" name="password" required placeholder="Enter your password">
                </div>

                <button class="btn btn-block" type="submit">Sign In</button>

                <div class="auth-switch">
                    Don't have an account? <a href="?page=register">Create one</a>
                </div>
            </form>
        </div>`;
}

function loadRegister() {
    app.innerHTML = `
        <div class="page-wrap">
            <form class="auth-wrap" id="register-form">
                <span class="eyebrow">Join ShopEase</span>
                <h1>Create your account</h1>
                <p>Register to start shopping with us.</p>

                <div class="form-group">
                    <label>Full name</label>
                    <input name="fullName" required placeholder="Your full name">
                </div>

                <div class="form-group">
                    <label>Email address</label>
                    <input type="email" name="email" required placeholder="you@example.com">
                </div>

                <div class="form-group">
                    <label>Phone number</label>
                    <input name="phone" placeholder="07XXXXXXXX">
                </div>

                <div class="form-group">
                    <label>Password</label>
                    <input type="password" name="password" minlength="8" required placeholder="At least 8 characters">
                </div>

                <button class="btn btn-block" type="submit">Create Account</button>

                <div class="auth-switch">
                    Already registered? <a href="?page=login">Sign in</a>
                </div>
            </form>
        </div>`;
}

async function loadCart() {
    if (!requireLogin()) return;

    const data = await ShopAPI.cart();
    const cart = data.cart || { items: [], totalItems: 0, totalAmount: 0 };
    currentCart = cart.items || [];

    if (!currentCart.length) {
        app.innerHTML = `
            <div class="page-wrap">
                ${pageTitle("Your shopping cart", "Your selected products will appear here.")}
                <div class="panel empty-state">
                    <div class="empty-icon"></div>
                    <h2>Your cart is empty</h2>
                    <p>Looks like you haven't added anything yet.</p>
                    <a class="btn" href="?page=products">Start shopping</a>
                </div>
            </div>`;
        return;
    }

    app.innerHTML = `
        <div class="page-wrap">
            ${pageTitle("Your shopping cart", `${cart.totalItems} item(s) in your cart.`)}
            <div class="cart-layout">
                <section class="panel">
                    ${currentCart.map(item => `
                        <div class="cart-item">
                            <div class="cart-thumb"></div>
                            <div>
                                <h3>${escapeHTML(item.name)}</h3>
                                <p>${money(item.price)} each</p>
                                <div class="cart-item-actions">
                                    <label>Qty</label>
                                    <input type="number" min="1" max="${item.stock}" value="${item.quantity}" data-quantity="${item.product_id}">
                                    <button class="btn btn-danger btn-small" data-remove="${item.product_id}">Remove</button>
                                </div>
                            </div>
                            <strong>${money(item.subtotal)}</strong>
                        </div>
                    `).join("")}
                </section>

                <aside class="panel">
                    <h2>Order summary</h2>
                    <div class="summary-row"><span>Items</span><strong>${cart.totalItems}</strong></div>
                    <div class="summary-row"><span>Subtotal</span><strong>${money(cart.totalAmount)}</strong></div>
                    <div class="summary-row"><span>Delivery</span><strong>Calculated separately</strong></div>
                    <div class="summary-row summary-total"><span>Total</span><strong>${money(cart.totalAmount)}</strong></div>
                    <a href="?page=checkout" class="btn btn-block">Proceed to checkout</a>
                    <a href="?page=products" class="btn btn-outline btn-block" style="margin-top:10px">Continue shopping</a>
                </aside>
            </div>
        </div>`;
}

async function loadCheckout() {
    if (!requireLogin()) return;

    const data = await ShopAPI.cart();
    const cart = data.cart || { items: [], totalAmount: 0 };

    if (!cart.items?.length) {
        toast("Your cart is empty.");
        location.href = "?page=cart";
        return;
    }

    app.innerHTML = `
        <div class="page-wrap">
            ${pageTitle("Secure checkout", "Review your order and choose a payment method.")}
            <div class="checkout-layout">
                <section class="panel">
                    <h2>Payment method</h2>
                    <form id="checkout-form">
                        <div class="form-group">
                            <label>Select payment method</label>
                            <select name="paymentMethod" required>
                                <option value="mpesa">M-Pesa (Simulation)</option>
                                <option value="card">Card (Simulation)</option>
                            </select>
                        </div>
                        <p style="color:var(--muted);line-height:1.7">
                            This demonstration uses simulated payments. No real money will be charged.
                        </p>
                        <button class="btn btn-block" type="submit">Place order and pay</button>
                    </form>
                </section>

                <aside class="panel">
                    <h2>Order summary</h2>
                    ${cart.items.map(item => `
                        <div class="summary-row">
                            <span>${escapeHTML(item.name)}  ${item.quantity}</span>
                            <strong>${money(item.subtotal)}</strong>
                        </div>`).join("")}
                    <div class="summary-row summary-total">
                        <span>Total</span>
                        <strong>${money(cart.totalAmount)}</strong>
                    </div>
                </aside>
            </div>
        </div>`;
}

async function loadOrders() {
    if (!requireLogin()) return;

    const data = await ShopAPI.orders();
    const orders = data.orders || [];

    app.innerHTML = `
        <div class="page-wrap">
            ${pageTitle("My orders", "Track your purchases and view order details.")}
            <div class="panel">
                ${orders.length ? `
                    <table class="data-table">
                        <thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead>
                        <tbody>
                            ${orders.map(order => `
                                <tr>
                                    <td>#${order.id}</td>
                                    <td>${new Date(order.created_at).toLocaleDateString()}</td>
                                    <td>${money(order.total_amount)}</td>
                                    <td><span class="status">${escapeHTML(order.status)}</span></td>
                                    <td><button class="btn btn-small btn-outline" data-order="${order.id}">View</button></td>
                                </tr>`).join("")}
                        </tbody>
                    </table>` :
                    `<div class="empty-state"><div class="empty-icon"></div><h2>No orders yet</h2><p>Your purchases will appear here.</p><a class="btn" href="?page=products">Explore products</a></div>`}
            </div>
            <div id="order-detail"></div>
        </div>`;
}

async function loadOrderDetails(id) {
    const data = await ShopAPI.order(id);
    const order = data.order;
    const container = document.getElementById("order-detail");

    container.innerHTML = `
        <div class="panel">
            <h2>Order #${order.id}</h2>
            <p>Status: <span class="status">${escapeHTML(order.status)}</span></p>
            ${order.items.map(item => `
                <div class="summary-row">
                    <span>${escapeHTML(item.product_name)}  ${item.quantity}</span>
                    <strong>${money(item.subtotal)}</strong>
                </div>`).join("")}
            <div class="summary-row summary-total"><span>Total</span><strong>${money(order.total_amount)}</strong></div>
        </div>`;
}

async function loadNotifications() {
    if (!requireLogin()) return;

    const data = await ShopAPI.notifications();
    const notifications = data.notifications || [];

    app.innerHTML = `
        <div class="page-wrap">
            <div class="section-heading">
                <div><h2>Notifications</h2><p>Updates about your orders and payments.</p></div>
                <button class="btn btn-outline" id="mark-all">Mark all as read</button>
            </div>
            <div class="panel">
                ${notifications.length ? notifications.map(item => `
                    <div class="notification ${item.is_read ? "" : "unread"}">
                        <div class="notification-icon"></div>
                        <div style="flex:1">
                            <p>${escapeHTML(item.message)}</p>
                            <small>${new Date(item.created_at).toLocaleString()}</small>
                        </div>
                        ${item.is_read ? "" : `<button class="btn btn-small btn-outline" data-read="${item.id}">Mark read</button>`}
                    </div>`).join("") :
                    `<div class="empty-state"><div class="empty-icon"></div><h2>You're all caught up</h2><p>No notifications yet.</p></div>`}
            </div>
        </div>`;
}

async function loadAccount() {
    if (!requireLogin()) return;

    const user = ShopAPI.user() || {};

    app.innerHTML = `
        <div class="page-wrap">
            ${pageTitle("My account", "Manage your ShopEase account.")}
            <div class="panel">
                <h2>Account information</h2>
                <div class="summary-row"><span>Name</span><strong>${escapeHTML(user.fullName || user.full_name || "")}</strong></div>
                <div class="summary-row"><span>Email</span><strong>${escapeHTML(user.email || "")}</strong></div>
                <div class="summary-row"><span>Account type</span><strong>${escapeHTML(user.role || "customer")}</strong></div>
                <a class="btn btn-outline" href="?page=orders">View my orders</a>
                <button class="btn btn-danger" id="logout" style="margin-left:8px">Sign out</button>
            </div>
        </div>`;
}

async function loadAdmin() {
    if (!requireLogin()) return;

    const user = ShopAPI.user() || {};

    if (user.role !== "admin") {
        app.innerHTML = `<div class="page-wrap"><div class="panel empty-state"><h2>Access restricted</h2><p>Administrator access is required to view this page.</p></div></div>`;
        return;
    }

    const [productsData, ordersData] = await Promise.all([
        ShopAPI.products(),
        ShopAPI.adminOrders()
    ]);

    const products = productsData.products || [];
    const orders = ordersData.orders || [];

    app.innerHTML = `
        <div class="page-wrap">
            ${pageTitle("Administration", "Manage the ShopEase store.")}
            <div class="stats-grid">
                <div class="stat-card"><span>Total products</span><strong>${products.length}</strong></div>
                <div class="stat-card"><span>Total orders</span><strong>${orders.length}</strong></div>
                <div class="stat-card"><span>Order revenue</span><strong>${money(orders.reduce((sum, o) => sum + Number(o.total_amount), 0))}</strong></div>
            </div>

            <div class="panel">
                <h2>Add a product</h2>
                <form id="product-form">
                    <div class="toolbar">
                        <input name="name" required placeholder="Product name">
                        <input name="category" required placeholder="Category">
                    </div>
                    <div class="toolbar">
                        <input name="price" type="number" min="0" step="0.01" required placeholder="Price">
                        <input name="stock" type="number" min="0" required placeholder="Stock">
                    </div>
                    <input class="field" name="description" placeholder="Description">
                    <button class="btn" style="margin-top:12px">Add product</button>
                </form>
            </div>

            <div class="panel">
                <h2>Products</h2>
                <table class="data-table">
                    <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th></tr></thead>
                    <tbody>${products.map(p => `
                        <tr><td>${escapeHTML(p.name)}</td><td>${escapeHTML(p.category)}</td><td>${money(p.price)}</td><td>${p.stock}</td></tr>
                    `).join("")}</tbody>
                </table>
            </div>

            <div class="panel">
                <h2>Recent orders</h2>
                <table class="data-table">
                    <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
                    <tbody>${orders.map(o => `
                        <tr><td>#${o.id}</td><td>${escapeHTML(o.customer_name)}</td><td>${money(o.total_amount)}</td><td><span class="status">${escapeHTML(o.status)}</span></td></tr>
                    `).join("")}</tbody>
                </table>
            </div>
        </div>`;
}

async function handleSubmit(event) {
    const form = event.target;
    event.preventDefault();

    try {
        if (form.id === "login-form") {
            const body = Object.fromEntries(new FormData(form));
            const data = await ShopAPI.login(body);
            ShopAPI.saveSession(data);
            toast("Welcome back!");
            location.href = "index.html";
        }

        if (form.id === "register-form") {
            const body = Object.fromEntries(new FormData(form));
            await ShopAPI.register(body);
            toast("Account created. Please sign in.");
            location.href = "?page=login";
        }

        if (form.id === "checkout-form") {
            const button = form.querySelector("button[type=submit]");
            button.disabled = true;
            button.textContent = "Processing...";

            try {
                const orderData = await ShopAPI.checkout();
                const orderId = orderData.order.orderId;
                const paymentMethod = new FormData(form).get("paymentMethod");

                const payment = await ShopAPI.pay(orderId, paymentMethod);

                app.innerHTML = `
                    <div class="page-wrap">
                        <div class="panel empty-state">
                            <div class="empty-icon"></div>
                            <h2>Order placed successfully!</h2>
                            <p>Your order #${orderId} has been confirmed.</p>
                            <p>Payment reference: <strong>${escapeHTML(payment.payment.transactionReference)}</strong></p>
                            <p>Total paid: <strong>${money(payment.payment.amount)}</strong></p>
                            <a class="btn" href="?page=orders">View my orders</a>
                        </div>
                    </div>`;
            } catch (error) {
                button.disabled = false;
                button.textContent = "Place order and pay";
                throw error;
            }
        }

        if (form.id === "product-form") {
            const body = Object.fromEntries(new FormData(form));
            body.price = Number(body.price);
            body.stock = Number(body.stock);

            await ShopAPI.createProduct(body);
            toast("Product added successfully.");
            await loadAdmin();
        }

    } catch (error) {
        toast(error.message);
    }
}

document.addEventListener("submit", handleSubmit);

document.addEventListener("click", async event => {
    const add = event.target.closest("[data-add]");
    const remove = event.target.closest("[data-remove]");
    const read = event.target.closest("[data-read]");
    const order = event.target.closest("[data-order]");

    try {
        if (add) {
            if (!requireLogin()) return;
            await ShopAPI.addToCart(Number(add.dataset.add), 1);
            toast("Product added to your cart.");
            updateHeader();
        }

        if (remove) {
            await ShopAPI.removeCartItem(Number(remove.dataset.remove));
            toast("Product removed.");
            await loadCart();
            updateHeader();
        }

        if (read) {
            await ShopAPI.markNotification(Number(read.dataset.read));
            await loadNotifications();
        }

        if (order) {
            await loadOrderDetails(Number(order.dataset.order));
        }

        if (event.target.id === "mark-all") {
            await ShopAPI.markAllNotifications();
            await loadNotifications();
        }

        if (event.target.id === "logout") {
            ShopAPI.logout();
        }

    } catch (error) {
        toast(error.message);
    }
});

document.addEventListener("change", async event => {
    if (event.target.matches("[data-quantity]")) {
        try {
            const productId = Number(event.target.dataset.quantity);
            const quantity = Number(event.target.value);

            if (!Number.isInteger(quantity) || quantity < 1) {
                throw new Error("Enter a valid quantity.");
            }

            await ShopAPI.updateCart(productId, quantity);
            toast("Cart updated.");
            await loadCart();
            updateHeader();

        } catch (error) {
            toast(error.message);
            await loadCart();
        }
    }
});

async function start() {
    updateHeader();

    try {
        const pages = {
            home: loadHome,
            products: loadProducts,
            login: loadLogin,
            register: loadRegister,
            cart: loadCart,
            checkout: loadCheckout,
            orders: loadOrders,
            notifications: loadNotifications,
            account: loadAccount,
            admin: loadAdmin
        };

        await (pages[page] || loadHome)();

    } catch (error) {
        app.innerHTML = `
            <div class="page-wrap">
                <div class="panel empty-state">
                    <div class="empty-icon"></div>
                    <h2>Unable to load this page</h2>
                    <p>${escapeHTML(error.message)}</p>
                    <button class="btn" onclick="location.reload()">Try again</button>
                </div>
            </div>`;
    }
}

start();
