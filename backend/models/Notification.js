const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: [
                "booking_request",
                "booking_confirmed",
                "booking_rejected",
                "booking_cancelled",
                "booking_completed",
                "refund_processed",
                "payment_refunded",
                "payment_verified",
                "system"
            ],
            default: "system"
        },
        link: {
            type: String,
            default: null
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            default: null
        },
        priority: {
            type: String,
            enum: ["urgent", "high", "normal"],
            default: "normal"
        },
        recipientRole: {
            type: String,
            enum: ["customer", "owner", "admin"],
            default: "owner"
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Notification", notificationSchema);
