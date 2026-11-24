const mongoose = require("mongoose");
const bikeRepository = require("../repositories/bikeRepository");
const bookingRepository = require("../repositories/bookingRepository");
const Booking = require("../models/Booking");

// ==========================================
// CREATE BIKE
// ==========================================
const createBike = async (bikeData, currentUser) => {
    if (
        !bikeData.bikeName ||
        !bikeData.brand ||
        !bikeData.model ||
        !bikeData.type ||
        bikeData.pricePerDay === undefined ||
        bikeData.pricePerDay === "" ||
        !bikeData.location
    ) {
        throw new Error("All required bike fields must be provided");
    }

    if (Number(bikeData.pricePerDay) < 0) {
        throw new Error("Rental price cannot be negative");
    }

    let ownerId;
    if (currentUser.role === "owner") {
        ownerId = currentUser.id;
    } else if (currentUser.role === "admin") {
        ownerId = bikeData.ownerId;
        if (!ownerId) {
            throw new Error("Owner ID is required when admin adds a bike");
        }
    } else {
        throw new Error("Only owners and admins can add bikes");
    }

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
        throw new Error("Invalid owner ID");
    }

    const approvalStatus = currentUser.role === "admin" ? "approved" : "pending";

    return await bikeRepository.createBike({
        ownerId,
        bikeName: bikeData.bikeName.trim(),
        brand: bikeData.brand.trim(),
        model: bikeData.model.trim(),
        type: bikeData.type.trim(),
        pricePerDay: Number(bikeData.pricePerDay),
        location: bikeData.location.trim(),
        image: bikeData.image || "",
        status: bikeData.status || "available",
        approvalStatus
    });
};

// ==========================================
// GET ALL
// ==========================================
const getAllBikes = async () => {
    return await bikeRepository.getAllBikes();
};

// ==========================================
// GET OWNER BIKES
// ==========================================
const getOwnerBikes = async (currentUser) => {
    if (!currentUser || !currentUser.id) {
        throw new Error("User authentication required");
    }

    if (currentUser.role !== "owner" && currentUser.role !== "admin") {
        throw new Error("Only bike owners can access their bikes");
    }

    return await bikeRepository.getBikesByOwnerId(currentUser.id);
};

// ==========================================
// GET BY ID
// ==========================================
const getBikeById = async (id) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid bike ID");
    }

    const bike = await bikeRepository.getBikeById(id);
    if (!bike) {
        throw new Error("Bike not found");
    }

    return bike;
};

// ==========================================
// UPDATE
// ==========================================
const updateBike = async (id, bikeData, currentUser) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid bike ID");
    }

    const bike = await bikeRepository.getBikeById(id);
    if (!bike) {
        throw new Error("Bike not found");
    }

    if (currentUser.role === "owner") {
        const bikeOwnerId = bike.ownerId?._id || bike.ownerId;
        if (bikeOwnerId.toString() !== currentUser.id.toString()) {
            throw new Error("You can only update your own bikes");
        }
    }

    if (currentUser.role === "customer") {
        throw new Error("Customers cannot update bikes");
    }

    delete bikeData.ownerId;

    return await bikeRepository.updateBike(id, bikeData);
};

// ==========================================
// DELETE
// ==========================================
const deleteBike = async (id, currentUser) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid bike ID");
    }

    const bike = await bikeRepository.getBikeById(id);
    if (!bike) {
        throw new Error("Bike not found");
    }

    if (currentUser.role === "owner") {
        const bikeOwnerId = bike.ownerId?._id || bike.ownerId;
        if (bikeOwnerId.toString() !== currentUser.id.toString()) {
            throw new Error("You can only delete your own bikes");
        }
    }

    if (currentUser.role === "customer") {
        throw new Error("Customers cannot delete bikes");
    }

    return await bikeRepository.deleteBike(id);
};

// ==========================================
// SEARCH BIKES (WITH DATE CONFLICT FILTERING)
// ==========================================
const searchBikes = async (query) => {
    const filter = {};

    if (query.search) {
        filter.$or = [
            { bikeName: { $regex: query.search, $options: "i" } },
            { brand: { $regex: query.search, $options: "i" } },
            { model: { $regex: query.search, $options: "i" } }
        ];
    }

    if (query.type && query.type !== "All") {
        filter.type = { $regex: query.type, $options: "i" };
    }

    if (query.location && query.location !== "All") {
        filter.location = { $regex: query.location, $options: "i" };
    }

    if (query.status) {
        filter.status = query.status;
    }

    if (query.minPrice || query.maxPrice) {
        filter.pricePerDay = {};
        if (query.minPrice) {
            filter.pricePerDay.$gte = Number(query.minPrice);
        }
        if (query.maxPrice) {
            filter.pricePerDay.$lte = Number(query.maxPrice);
        }
    }

    // Only approved and available bikes for public searches
    filter.approvalStatus = "approved";
    if (!filter.status) {
        filter.status = "available";
    }

    // FEATURE 5 & DATE-BASED AVAILABILITY:
    // Hide bikes with overlapping reservations for given dates using half-open interval rule:
    // requestedStartDate < existingEndDate AND requestedEndDate > existingStartDate
    // (startDate < end && endDate > start)
    if (query.startDate && query.endDate) {
        await bookingRepository.expirePendingBookings();
        const start = bookingRepository.parseBookingDate(query.startDate);
        const end = bookingRepository.parseBookingDate(query.endDate);

        if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime()) && start < end) {
            const now = new Date();
            const conflictingBookings = await Booking.find({
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
            }).select("bikeId");

            const bookedBikeIds = conflictingBookings.map((b) => b.bikeId);
            if (bookedBikeIds.length > 0) {
                filter._id = { $nin: bookedBikeIds };
            }
        }
    }

    return await bikeRepository.searchBikes(filter);
};

// ==========================================
// CHECK BIKE AVAILABILITY FOR DATES
// ==========================================
const checkBikeAvailability = async (bikeId, startDate, endDate) => {
    if (!bikeId || !mongoose.Types.ObjectId.isValid(bikeId)) {
        throw new Error("Invalid bike ID");
    }

    if (!startDate || !endDate) {
        throw new Error("Both start date and end date are required");
    }

    const start = bookingRepository.parseBookingDate(startDate);
    const end = bookingRepository.parseBookingDate(endDate);

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Invalid rental dates provided");
    }

    if (start >= end) {
        throw new Error("Rental start date must be before end date");
    }

    const bike = await bikeRepository.getBikeById(bikeId);
    if (!bike) {
        throw new Error("Bike not found");
    }

    if (bike.approvalStatus !== "approved" || bike.status === "blocked" || bike.status === "unavailable") {
        return {
            available: false,
            message: "Sorry! This bike is currently not available for rental."
        };
    }

    const conflicts = await bookingRepository.findConflictingBookings(bikeId, start, end);
    if (conflicts && conflicts.length > 0) {
        return {
            available: false,
            message: "Sorry! This bike is already booked for some of your selected dates. Please select another date range or choose another bike."
        };
    }

    return {
        available: true,
        message: "Bike is available for the selected dates."
    };
};

module.exports = {
    createBike,
    getAllBikes,
    getOwnerBikes,
    getBikeById,
    updateBike,
    deleteBike,
    searchBikes,
    checkBikeAvailability
};
