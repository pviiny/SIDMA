const path = require("path");
const cors = require("cors");
const express = require("express");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const denunciaRoutes = require("./routes/denunciaRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/denuncias", denunciaRoutes);

app.use(express.static(path.join(__dirname, "..")));

app.get("/api/health", (_req, res) => {
    res.json({ status: "online", service: "SIDMA API" });
});

app.use((req, res) => {
    res.status(404).json({
        error: "Rota nao encontrada",
        path: req.originalUrl
    });
});

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({
        error: err.message || "Erro interno do servidor"
    });
});

module.exports = app;
