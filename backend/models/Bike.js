const mongoose = require("mongoose");

const bikeSchema = new mongoose.Schema(
    {
        // ======================================
        // BIKE OWNER
        // ======================================

        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // ======================================
        // BIKE INFORMATION
        // ======================================

        bikeName: {
            type: String,
            required: true,
            trim: true
        },

        brand: {
            type: String,
            required: true,
            trim: true
        },

        model: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            required: true,
            trim: true
        },

        // ======================================
        // RENTAL INFORMATION
        // ======================================

        pricePerDay: {
            type: Number,
            required: true,
            min: 0
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        // ======================================
        // IMAGE
        // ======================================

        image: {
            type: String,
            default: ""
        },

        // ======================================
        // AVAILABILITY & APPROVAL
        // ======================================

        status: {
            type: String,
            enum: [
                "available",
                "unavailable",
                "blocked"
            ],
            default: "available"
        },

        approvalStatus: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected",
                "blocked"
            ],
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

        previousStatus: {
            type: String,
            default: "available"
        },

        previousApprovalStatus: {
            type: String,
            default: "approved"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Bike",
    bikeSchema
);