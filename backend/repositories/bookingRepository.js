const Booking = require("../models/Booking");
const Bike = require("../models/Bike");

// ==========================================
// EXPIRE PENDING BOOKINGS
// ==========================================
const expirePendingBookings = async () => {
    const now = new Date();
    return await Booking.updateMany(
        {
            status: { $in: ["Pending Owner Verification", "pending"] },
            reservationExpiresAt: { $ne: null, $lt: now }
        },
        {
            $set: {
                status: "Expired",
                paymentStatus: "Rejected"
            }
        }
    );
};

// ==========================================
// CREATE BOOKING
// ==========================================
const createBooking = async (bookingData) => {
    const booking = await Booking.create(bookingData);
    return await Booking.findById(booking._id)
        .populate("userId", "name email mobile drivingLicenseNumber drivingLicenseImage status createdAt")
        .populate("bikeId", "bikeName brand model type pricePerDay location image status approvalStatus")
        .populate("ownerId", "name email mobile businessName address qrCode cancellationChargePercentage cancellationTerms");
};

// ==========================================
// GET BOOKING BY ID
// ==========================================
const getBookingById = async (id) => {
    await expirePendingBookings();
    return await Booking.findById(id)
        .populate("userId", "name email mobile drivingLicenseNumber drivingLicenseImage status createdAt")
        .populate("bikeId", "bikeName brand model type pricePerDay location image status approvalStatus")
        .populate("ownerId", "name email mobile businessName address qrCode cancellationChargePercentage cancellationTerms");
};

// ==========================================
// GET OWNER BOOKINGS
// ==========================================
const getOwnerBookings = async (ownerId, status = null) => {
    await expirePendingBookings();
    const query = { ownerId };

    if (status && status !== "all") {
        const lower = status.toLowerCase();
        if (lower === "pending" || lower === "pending owner verification") {
            query.status = { $in: ["Pending Owner Verification", "pending"] };
        } else if (lower === "confirmed") {
            query.status = { $in: ["Confirmed", "confirmed"] };
        } else if (lower === "rejected") {
            query.status = { $in: ["Rejected", "rejected"] };
        } else if (lower === "cancelled") {
            query.status = { $in: ["Cancelled", "cancelled"] };
        } else if (lower === "completed") {
            query.status = { $in: ["Completed", "completed"] };
        } else if (lower === "expired") {
            query.status = "Expired";
        } else {
            query.status = status;
        }
    }

    return await Booking.find(query)
        .populate("userId", "name email mobile drivingLicenseNumber drivingLicenseImage status createdAt")
        .populate("bikeId", "bikeName brand model type pricePerDay location image status")
        .populate("ownerId", "name email mobile businessName address qrCode")
        .sort({ createdAt: -1 });
};

// ==========================================
// GET CLIENT / MY BOOKINGS
// ==========================================
const getUserBookings = async (userId) => {
    await expirePendingBookings();
    return await Booking.find({ userId })
        .populate("bikeId", "bikeName brand model type pricePerDay location image status")
        .populate("ownerId", "name email mobile businessName address qrCode cancellationChargePercentage cancellationTerms")
        .sort({ createdAt: -1 });
};

// ==========================================
// DATE PARSER HELPER (NORMALIZES UTC MIDNIGHT)
// ==========================================
const parseBookingDate = (dateVal) => {
    if (!dateVal) return null;
    if (dateVal instanceof Date) return dateVal;
    if (typeof dateVal === "string") {
        const trimmed = dateVal.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return new Date(`${trimmed}T00:00:00.000Z`);
        }
    }
    return new Date(dateVal);
};

// ==========================================
// CONFLICT CHECK (CONFIRMED OR PENDING OVERLAPPING DATES)
// Half-open interval [start, end) rule:
// requestedStartDate < existingEndDate AND requestedEndDate > existingStartDate
// In MongoDB: startDate < requestedEndDate AND endDate > requestedStartDate
// ==========================================
const findConflictingBookings = async (bikeId, startDate, endDate, excludeBookingId = null) => {
    await expirePendingBookings();
    const now = new Date();

    const start = parseBookingDate(startDate);
    const end = parseBookingDate(endDate);

    const query = {
        bikeId,
        status: {
            $in: [
                "Confirmed",
                "Pending Owner Verification",
                "Active",
                "confirmed",
                "pending"
            ]
        },
        $and: [
            {
                $or: [
                    { reservationExpiresAt: null },
                    { reservationExpiresAt: { $gt: now } }
                ]
            },
            {
                startDate: { $lt: end },
                endDate: { $gt: start }
            }
        ]
    };

    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    return await Booking.find(query);
};

// ==========================================
// UPDATE BOOKING
// ==========================================
const updateBooking = async (id, updateData) => {
    return await Booking.findByIdAndUpdate(
        id,
        updateData,
        {
            returnDocument: "after",
            runValidators: true
        }
    )
        .populate("userId", "name email mobile drivingLicenseNumber drivingLicenseImage status createdAt")
        .populate("bikeId", "bikeName brand model type pricePerDay location image status")
        .populate("ownerId", "name email mobile businessName address qrCode");
};

// ==========================================
// GET OWNER STATS
// ==========================================
const getOwnerStats = async (ownerId) => {
    await expirePendingBookings();
    const [totalBikes, allBookings] = await Promise.all([
        Bike.countDocuments({ ownerId }),
        Booking.find({ ownerId })
    ]);

    const totalRequests = allBookings.length;
    const pendingRequests = allBookings.filter(
        (b) => b.status === "Pending Owner Verification" || b.status === "pending"
    ).length;
    const confirmedBookings = allBookings.filter(
        (b) => b.status === "Confirmed" || b.status === "confirmed"
    ).length;
    const completedBookings = allBookings.filter(
        (b) => b.status === "Completed" || b.status === "completed"
    ).length;
    const rejectedBookings = allBookings.filter(
        (b) => b.status === "Rejected" || b.status === "rejected"
    ).length;
    const cancelledBookings = allBookings.filter(
        (b) => b.status === "Cancelled" || b.status === "cancelled"
    ).length;

    const confirmedEarnings = allBookings
        .filter((b) => b.status === "Confirmed" || b.status === "confirmed")
        .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const completedEarnings = allBookings
        .filter((b) => b.status === "Completed" || b.status === "completed")
        .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const advanceCollected = allBookings
        .filter((b) => ["Confirmed", "confirmed", "Completed", "completed"].includes(b.status))
        .reduce((sum, b) => sum + (Number(b.advanceAmount) || 0), 0);

    const totalEarnings = confirmedEarnings + completedEarnings;

    return {
        totalBikes,
        totalRequests,
        pendingRequests,
        confirmedBookings,
        completedBookings,
        rejectedBookings,
        cancelledBookings,
        totalEarnings,
        confirmedEarnings,
        completedEarnings,
        advanceCollected
    };
};

// ==========================================
// GET OWNER EARNINGS BREAKDOWN
// ==========================================
const getOwnerEarningsData = async (ownerId) => {
    const stats = await getOwnerStats(ownerId);

    const history = await Booking.find({
        ownerId,
        status: { $in: ["Confirmed", "confirmed", "Completed", "completed"] }
    })
        .populate("userId", "name email mobile drivingLicenseNumber drivingLicenseImage")
        .populate("bikeId", "bikeName brand model image pricePerDay")
        .sort({ updatedAt: -1, createdAt: -1 });

    return {
        ...stats,
        history
    };
};

module.exports = {
    parseBookingDate,
    expirePendingBookings,
    createBooking,
    getBookingById,
    getOwnerBookings,
    getUserBookings,
    findConflictingBookings,
    updateBooking,
    getOwnerStats,
    getOwnerEarningsData
};
