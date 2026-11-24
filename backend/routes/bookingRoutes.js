const express = require("express");

const {
    createBooking,
    getOwnerBookings,
    getOwnerRequests,
    getOwnerConfirmed,
    getOwnerCompleted,
    getOwnerStats,
    getOwnerEarnings,
    getUserBookings,
    getBookingById,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    completeRefund,
    completeBooking
} = require("../controllers/bookingController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// ==========================================
// ALL BOOKING ROUTES REQUIRE AUTHENTICATION
// ==========================================
router.use(protect);

// ==========================================
// CLIENT BOOKINGS
// ==========================================
router.post("/", upload.single("paymentScreenshot"), createBooking);
router.get("/my", getUserBookings);

// ==========================================
// OWNER BOOKINGS & ANALYTICS
// IMPORTANT: specific /owner subpaths MUST come before /:id
// ==========================================
router.get("/owner", authorize("owner", "admin"), getOwnerBookings);
router.get("/owner/requests", authorize("owner", "admin"), getOwnerRequests);
router.get("/owner/confirmed", authorize("owner", "admin"), getOwnerConfirmed);
router.get("/owner/completed", authorize("owner", "admin"), getOwnerCompleted);
router.get("/owner/stats", authorize("owner", "admin"), getOwnerStats);
router.get("/owner/earnings", authorize("owner", "admin"), getOwnerEarnings);

// ==========================================
// SINGLE BOOKING & ACTIONS
// ==========================================
router.get("/:id", getBookingById);
router.put("/:id/accept", authorize("owner", "admin"), acceptBooking);
router.put("/:id/verify-approve", authorize("owner", "admin"), acceptBooking);
router.put("/:id/reject", authorize("owner", "admin"), rejectBooking);
router.put("/:id/verify-reject", authorize("owner", "admin"), rejectBooking);
router.put("/:id/cancel", cancelBooking);
router.put("/:id/refund", authorize("owner", "admin"), completeRefund);
router.put("/:id/complete", authorize("owner", "admin"), completeBooking);

module.exports = router;
