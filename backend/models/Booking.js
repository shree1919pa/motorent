const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        bikeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bike",
            required: true
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        totalDays: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        pricePerDay: {
            type: Number,
            required: true,
            min: 0
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        advancePercentage: {
            type: Number,
            required: true,
            default: 20
        },
        advanceAmount: {
            type: Number,
            required: true,
            min: 0
        },
        advancePaid: {
            type: Number,
            min: 0,
            default: function () {
                return this.advanceAmount || 0;
            }
        },
        remainingAmount: {
            type: Number,
            required: true,
            min: 0
        },
        paymentScreenshot: {
            type: String,
            default: ""
        },
        paymentTransactionId: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: [
                "Pending Payment",
                "Pending Owner Verification",
                "Confirmed",
                "Rejected",
                "Cancelled",
                "Active",
                "Completed",
                "Expired",
                // legacy support
                "pending",
                "confirmed",
                "rejected",
                "cancelled",
                "completed"
            ],
            default: "Pending Owner Verification"
        },
        paymentStatus: {
            type: String,
            enum: [
                "Not Paid",
                "Evidence Submitted",
                "Verified",
                "Rejected",
                "Refund Pending",
                "Refunded",
                // legacy support
                "pending",
                "paid",
                "failed",
                "refunded"
            ],
            default: "Evidence Submitted"
        },
        reservationExpiresAt: {
            type: Date,
            default: null
        },
        rejectionReason: {
            type: String,
            trim: true,
            default: ""
        },
        cancellationDeduction: {
            type: Number,
            default: 0
        },
        cancellationPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        maximumCancellationDeduction: {
            type: Number,
            default: 0
        },
        actualCancellationDeduction: {
            type: Number,
            default: 0
        },
        refundAmount: {
            type: Number,
            default: 0
        },
        refundStatus: {
            type: String,
            enum: ["Not Applicable", "Refund Pending", "Refunded"],
            default: "Not Applicable"
        },
        refundTransactionReference: {
            type: String,
            trim: true,
            default: ""
        },
        cancellationDate: {
            type: Date,
            default: null
        },
        cancelledAt: {
            type: Date,
            default: null
        },
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        cancellationReason: {
            type: String,
            trim: true,
            default: ""
        },
        policyAccepted: {
            type: Boolean,
            default: true
        },
        customerName: {
            type: String,
            trim: true,
            default: ""
        },
        customerMobile: {
            type: String,
            trim: true,
            default: ""
        },
        notes: {
            type: String,
            trim: true,
            default: ""
        },
        bookingDate: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Compound index for fast overlapping booking checks
bookingSchema.index({ bikeId: 1, startDate: 1, endDate: 1, status: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
