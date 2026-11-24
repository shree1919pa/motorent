const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");

const createAdmin = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/motorent";
        console.log("Connecting to MongoDB at:", mongoUri);
        await mongoose.connect(mongoUri);

        const email = "admin@motorent.com".toLowerCase().trim();
        const rawPassword = "Admin@123";
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email });

        if (existingAdmin) {
            existingAdmin.name = "System Admin";
            existingAdmin.mobile = "9999999999";
            existingAdmin.password = hashedPassword;
            existingAdmin.role = "admin";
            existingAdmin.status = "active";
            existingAdmin.isBlocked = false;
            existingAdmin.blockReason = "";
            existingAdmin.blockedAt = null;
            existingAdmin.blockedBy = null;
            await existingAdmin.save();
            console.log("Admin account updated successfully!");
            console.log("User details:", {
                id: existingAdmin._id,
                name: existingAdmin.name,
                email: existingAdmin.email,
                role: existingAdmin.role,
                status: existingAdmin.status
            });
        } else {
            const newAdmin = await User.create({
                name: "System Admin",
                email: email,
                mobile: "9999999999",
                password: hashedPassword,
                role: "admin",
                status: "active",
                isBlocked: false
            });
            console.log("Admin account created successfully!");
            console.log("User details:", {
                id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
                role: newAdmin.role,
                status: newAdmin.status
            });
        }

        await mongoose.connection.close();
        console.log("Done.");
        process.exit(0);
    } catch (error) {
        console.error("Error creating admin:", error);
        process.exit(1);
    }
};

createAdmin();
