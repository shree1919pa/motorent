const Bike = require("../models/Bike");

// ==========================================
// CREATE BIKE
// ==========================================
const createBike = async (bikeData) => {
    const bike = await Bike.create(bikeData);
    return await Bike.findById(bike._id).populate(
        "ownerId",
        "name email mobile businessName address qrCode cancellationChargePercentage cancellationTerms"
    );
};

// ==========================================
// GET BIKES BY OWNER ID
// ==========================================
const getBikesByOwnerId = async (ownerId) => {
    return await Bike.find({ ownerId })
        .populate("ownerId", "name email mobile businessName address qrCode cancellationChargePercentage cancellationTerms")
        .sort({ createdAt: -1 });
};

// ==========================================
// GET ALL APPROVED BIKES (PUBLIC)
// ==========================================
const getAllBikes = async () => {
    return await Bike.find({
        approvalStatus: "approved",
        status: "available"
    })
        .populate("ownerId", "name email mobile businessName address qrCode cancellationChargePercentage cancellationTerms")
        .sort({ createdAt: -1 });
};

// ==========================================
// GET BIKE BY ID
// ==========================================
const getBikeById = async (id) => {
    return await Bike.findById(id).populate(
        "ownerId",
        "name email mobile businessName address qrCode profileImage cancellationChargePercentage cancellationTerms"
    );
};

// ==========================================
// UPDATE BIKE
// ==========================================
const updateBike = async (id, bikeData) => {
    return await Bike.findByIdAndUpdate(
        id,
        bikeData,
        {
            returnDocument: "after",
            runValidators: true
        }
    ).populate(
        "ownerId",
        "name email mobile businessName address qrCode cancellationChargePercentage cancellationTerms"
    );
};

// ==========================================
// DELETE BIKE
// ==========================================
const deleteBike = async (id) => {
    return await Bike.findByIdAndDelete(id);
};

// ==========================================
// SEARCH BIKES
// ==========================================
const searchBikes = async (filter) => {
    return await Bike.find(filter)
        .populate("ownerId", "name email mobile businessName address qrCode cancellationChargePercentage cancellationTerms")
        .sort({ createdAt: -1 });
};

module.exports = {
    createBike,
    getBikesByOwnerId,
    getAllBikes,
    getBikeById,
    updateBike,
    deleteBike,
    searchBikes
};
