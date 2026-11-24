const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seedAdminUser = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || "admin@motorent.com";
        const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

        const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await User.create({
                name: "System Administrator",
                email: adminEmail.toLowerCase(),
                mobile: "9876543210",
                password: hashedPassword,
                role: "admin",
                status: "active"
            });
            console.log(`[SEED] Default admin account initialized: ${adminEmail}`);
        } else {
            // Ensure existing admin remains active and role preserved
            let needsUpdate = false;
            if (existingAdmin.status !== "active" || existingAdmin.role !== "admin" || existingAdmin.isBlocked) {
                existingAdmin.status = "active";
                existingAdmin.role = "admin";
                existingAdmin.isBlocked = false;
                needsUpdate = true;
            }
            if (needsUpdate) {
                await existingAdmin.save();
            }
        }
    } catch (err) {
        console.error("[SEED ERROR] Admin seeding check:", err.message);
    }
};

let isConnecting = false;

const connectDB = async () => {
    // Return existing connection if already active
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (isConnecting) {
        console.log("Database connection attempt already in progress. Waiting...");
        return;
    }

    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        throw new Error(
            "MONGODB_URI or MONGO_URI is not defined. Please set your MongoDB Atlas connection string in your environment variables."
        );
    }

    const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        autoIndex: process.env.NODE_ENV !== "production" // Build indexes automatically only in non-production
    };

    if (process.env.DB_NAME) {
        options.dbName = process.env.DB_NAME;
    }

    try {
        isConnecting = true;

        // Register connection event listeners once
        if (!mongoose.connection._hasRegisteredListeners) {
            mongoose.connection.on("connected", () => {
                console.log("[DATABASE] MongoDB Atlas connected successfully.");
            });

            mongoose.connection.on("error", (err) => {
                console.error("[DATABASE ERROR] MongoDB Atlas connection error:", err.message);
            });

            mongoose.connection.on("disconnected", () => {
                console.warn("[DATABASE WARN] MongoDB Atlas connection disconnected.");
            });

            mongoose.connection._hasRegisteredListeners = true;
        }

        const conn = await mongoose.connect(uri, options);
        isConnecting = false;

        // Mask URI for safe logging
        const sanitizedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
        console.log(`[DATABASE] Connected to MongoDB Atlas cluster at: ${sanitizedUri}`);

        // Seed admin user safely
        await seedAdminUser();

        return conn;
    } catch (error) {
        isConnecting = false;
        console.error("\n========================================================");
        console.error("MONGODB ATLAS CONNECTION FAILURE:");
        console.error("  Error:", error.message);
        console.error("  Please check:");
        console.error("  1. Is MONGODB_URI set correctly in .env or Render environment?");
        console.error("  2. Did you whitelist '0.0.0.0/0' in MongoDB Atlas Network Access?");
        console.error("  3. Are your database username and password correct?");
        console.error("========================================================\n");
        throw error;
    }
};

module.exports = connectDB;
