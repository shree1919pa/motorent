const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            default: null
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        paymentMethod: {
            type: String,
            default: "Online"
        },
        paymentStatus: {
            type: String,
            enum: ["successful", "pending", "failed", "refunded"],
            default: "successful"
        },
        transactionId: {
            type: String,
            default: () => "TXN" + Date.now() + Math.floor(Math.random() * 1000)
        },
        paidAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Payment", paymentSchema);
