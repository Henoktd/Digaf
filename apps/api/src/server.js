"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const pool_1 = require("./db/pool");
const entityRoutes_1 = require("./routes/entityRoutes");
const shareClassRoutes_1 = require("./routes/shareClassRoutes");
const shareholderRoutes_1 = require("./routes/shareholderRoutes");
const capTableRoutes_1 = require("./routes/capTableRoutes");
const certificateRoutes_1 = require("./routes/certificateRoutes");
const transferRoutes_1 = require("./routes/transferRoutes");
const approvalRoutes_1 = require("./routes/approvalRoutes");
const auditLogRoutes_1 = require("./routes/auditLogRoutes");
const slaRoutes_1 = require("./routes/slaRoutes");
const legalHoldRoutes_1 = require("./routes/legalHoldRoutes");
const communicationRoutes_1 = require("./routes/communicationRoutes");
const documentRoutes_1 = require("./routes/documentRoutes");
const dashboardRoutes_1 = require("./routes/dashboardRoutes");
dotenv_1.default.config();
const app = (0, express_1.default)();
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
app.use(allowedOrigins?.length
    ? (0, cors_1.default)({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(null, false);
        },
    })
    : (0, cors_1.default)());
app.use(express_1.default.json());
const port = process.env.PORT || 4000;
app.get("/", (_req, res) => {
    res.json({
        service: "Digaf Shareholder Governance Platform API",
        architecture: "Final v3 - No Dataverse",
        status: "running",
    });
});
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        timestampUtc: new Date().toISOString(),
    });
});
app.get("/health/db", async (_req, res) => {
    try {
        const result = await pool_1.pool.query("select now() as database_time");
        res.json({
            status: "ok",
            database: "connected",
            databaseTime: result.rows[0].database_time,
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            database: "not connected",
            message: error instanceof Error ? error.message : "Unknown database error",
        });
    }
});
app.get("/api/version", (_req, res) => {
    res.json({
        name: "Digaf Shareholder Governance Platform API",
        architecture: "Final v3 - No Dataverse",
        environment: process.env.NODE_ENV || "local",
        status: "ok",
        timestampUtc: new Date().toISOString(),
    });
});
app.use("/api/entities", entityRoutes_1.entityRoutes);
app.use("/api/share-classes", shareClassRoutes_1.shareClassRoutes);
app.use("/api/shareholders", shareholderRoutes_1.shareholderRoutes);
app.use("/api/cap-table", capTableRoutes_1.capTableRoutes);
app.use("/api/certificates", certificateRoutes_1.certificateRoutes);
app.use("/api/transfers", transferRoutes_1.transferRoutes);
app.use("/api/approvals", approvalRoutes_1.approvalRoutes);
app.use("/api/audit-logs", auditLogRoutes_1.auditLogRoutes);
app.use("/api/sla-monitor", slaRoutes_1.slaRoutes);
app.use("/api/legal-holds", legalHoldRoutes_1.legalHoldRoutes);
app.use("/api/communications", communicationRoutes_1.communicationRoutes);
app.use("/api/documents", documentRoutes_1.documentRoutes);
app.use("/api/dashboard", dashboardRoutes_1.dashboardRoutes);
if (process.env.NODE_ENV !== "production") {
    app.listen(port, () => {
        console.log(`Digaf Governance Platform API running on port ${port}`);
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map