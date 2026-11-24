const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");

// Load environment variables early from local backend directory or root
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

// Validate critical environment configurations
const { validateEnv } = require("./config/validateEnv");
validateEnv();

const connectDB = require("./config/database");
const { isCloudinaryConfigured } = require("./config/cloudinary");

const userRoutes = require("./routes/userRoutes");
const bikeRoutes = require("./routes/bikeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// ==========================================
// CORS CONFIGURATION (PRODUCTION & DEVELOPMENT)
// ==========================================

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
];

// Add frontend URL if provided
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL.trim().replace(/\/$/, ""));
}

// Support comma-separated additional origins in CORS_ORIGIN
if (process.env.CORS_ORIGIN) {
    process.env.CORS_ORIGIN.split(",")
        .map((origin) => origin.trim().replace(/\/$/, ""))
        .filter(Boolean)
        .forEach((origin) => {
            if (!allowedOrigins.includes(origin)) {
                allowedOrigins.push(origin);
            }
        });
}

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server health checks)
        if (!origin) {
            return callback(null, true);
        }

        const normalizedOrigin = origin.replace(/\/$/, "");

        // Check exact match in whitelist
        if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        // Allow any Render subdomain or preview deployments (*.onrender.com)
        if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(normalizedOrigin)) {
            return callback(null, true);
        }

        // In non-production, be permissive
        if (process.env.NODE_ENV !== "production") {
            return callback(null, true);
        }

        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

app.use(cors(corsOptions));

// ==========================================
// BODY PARSERS
// ==========================================

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);

// ==========================================
// STATIC UPLOADS (LOCAL STORAGE FALLBACK)
// ==========================================

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"), {
        maxAge: "1d",
        setHeaders: (res) => {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        }
    })
);

// ==========================================
// ROOT & HEALTH CHECK ROUTES
// ==========================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        name: "MotoRent API",
        status: "operational",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "MotoRent API connection successful"
    });
});

app.get("/api/health", (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };
    const isDbReady = dbState === 1;

    const healthData = {
        status: isDbReady ? "ok" : "degraded",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: {
            state: dbStatusMap[dbState] || "unknown",
            connected: isDbReady,
            name: mongoose.connection.name || null
        },
        storage: {
            mode: isCloudinaryConfigured() ? "cloudinary" : "local-disk",
            cloudinaryActive: isCloudinaryConfigured()
        },
        environment: process.env.NODE_ENV || "development"
    };

    res.status(isDbReady ? 200 : 503).json(healthData);
});

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/users", userRoutes);
app.use("/api/bikes", bikeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);

// ==========================================
// 404 CATCH-ALL ROUTE
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.originalUrl} not found on MotoRent API`
    });
});

// ==========================================
// CENTRALIZED ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
    console.error("[Server Error]", err.stack || err.message || err);

    // Multer file size / type error handling
    if (err.name === "MulterError") {
        return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`
        });
    }

    const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal server error occurred",
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
    });
});

// ==========================================
// SERVER INITIALIZATION
// ==========================================

let serverInstance = null;

const startServer = async () => {
    try {
        const PORT = parseInt(process.env.PORT, 10) || 5000;
        // Ensure database connection is ready before accepting traffic
        await connectDB();

        serverInstance = app.listen(PORT, "0.0.0.0", () => {
            console.log(`========================================`);
            console.log(`  MotoRent Backend API Running          `);
            console.log(`  Port:        ${PORT}                  `);
            console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
            console.log(`  Health:      http://localhost:${PORT}/api/health`);
            console.log(`========================================`);
        });

        // Graceful shutdown handling
        const gracefulShutdown = async (signal) => {
            console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);

            if (serverInstance) {
                serverInstance.close(() => {
                    console.log("[Server] Closed incoming HTTP connections.");
                });
            }

            try {
                await mongoose.connection.close(false);
                console.log("[Database] Mongoose connection closed.");
                process.exit(0);
            } catch (closeErr) {
                console.error("[Database] Error during disconnect:", closeErr.message);
                process.exit(1);
            }
        };

        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

    } catch (startupError) {
        console.error("FATAL: Failed to start MotoRent server:", startupError.message);
        process.exit(1);
    }
};

// Start server when run directly
if (require.main === module) {
    startServer();
}

module.exports = app;
module.exports.startServer = startServer;
