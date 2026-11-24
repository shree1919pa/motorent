const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        mobile: {
            type: String,
            required: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["customer", "owner", "admin"],
            default: "customer"
        },

        status: {
            type: String,
            enum: ["pending", "active", "rejected", "suspended", "blocked"],
            default: "pending"
        },

        // Blocking metadata
        isBlocked: {
            type: Boolean,
            default: false
        },

        blockReason: {
            type: String,
            default: ""
        },

        blockedAt: {
            type: Date,
            default: null
        },

        blockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // Owner-specific information
        businessName: {
            type: String,
            trim: true,
            default: ""
        },

        address: {
            type: String,
            trim: true,
            default: ""
        },

        qrCode: {
            type: String,
            default: ""
        },

        profileImage: {
            type: String,
            default: ""
        },

        cancellationChargePercentage: {
            type: Number,
            default: 20,
            min: 0,
            max: 100
        },

        cancellationTerms: {
            type: String,
            default: "20% deduction from advance payment upon cancellation."
        },

        // Client Driving Licence Verification
        drivingLicenseNumber: {
            type: String,
            trim: true,
            default: ""
        },

        drivingLicenseImage: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);