const express = require("express");

const {
    createBike,
    getAllBikes,
    getOwnerBikes,
    getBikeById,
    updateBike,
    deleteBike,
    searchBikes,
    checkBikeAvailability
} = require("../controllers/bikeController");

const protect =
    require("../middleware/authMiddleware");

const authorize =
    require("../middleware/roleMiddleware");

const upload =
    require("../middleware/uploadMiddleware");

const router =
    express.Router();

// ==========================================
// PUBLIC
// ==========================================

// Get all bikes
router.get(
    "/",
    getAllBikes
);

// Search
router.get(
    "/search",
    searchBikes
);

// ==========================================
// OWNER
// IMPORTANT: /owner MUST come before /:id
// ==========================================

router.get(
    "/owner",
    protect,
    authorize("owner"),
    getOwnerBikes
);

// ==========================================
// AVAILABILITY CHECK
// ==========================================

router.get(
    "/:id/availability",
    checkBikeAvailability
);

// ==========================================
// GET ONE
// ==========================================

router.get(
    "/:id",
    getBikeById
);

// ==========================================
// CREATE
// ==========================================

router.post(
    "/",
    protect,
    authorize("owner", "admin"),
    upload.single("image"),
    createBike
);

// ==========================================
// UPDATE
// ==========================================

router.put(
    "/:id",
    protect,
    authorize("owner", "admin"),
    upload.single("image"),
    updateBike
);

// ==========================================
// DELETE
// ==========================================

router.delete(
    "/:id",
    protect,
    authorize("owner", "admin"),
    deleteBike
);

module.exports = router;