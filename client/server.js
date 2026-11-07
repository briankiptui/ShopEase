"use strict";

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || process.env.CLIENT_PORT || 3000;

app.get("/config.js", (req, res) => {
    const apiBase = process.env.API_BASE_URL || "http://127.0.0.1:5100/api";

    res.setHeader("Cache-Control", "no-store");
    res.type("application/javascript").send(
        `window.SHOP_API_BASE = ${JSON.stringify(apiBase)};`
    );
});
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
    console.log("======================================");
    console.log("          SHOPEASE FRONTEND");
    console.log("======================================");
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log("======================================");
});
