const bookingService = require("../services/bookingService");

// ==========================================
// CREATE BOOKING (CLIENT WITH ADVANCE EVIDENCE)
// ==========================================
const createBooking = async (req, res) => {
    try {
        const booking = await bookingService.createBooking(req.body, req.file, req.user);
        res.status(201).json({
            success: true,
            message: "Booking request with advance payment evidence submitted successfully",
            booking
        });
    } catch (error) {
        console.error("Create Booking Error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// GET OWNER BOOKINGS
// ==========================================
const getOwnerBookings = async (req, res) => {
    try {
        const bookings = await bookingService.getOwnerBookings(req.user, req.query.status);
        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.error("Get Owner Bookings Error:", error);
        res.status(403).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// GET OWNER REQUESTS (PENDING OWNER VERIFICATION)
// ==========================================
const getOwnerRequests = async (req, res) => {
    try {
        const requests = await bookingService.getOwnerRequests(req.user);
        res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (error) {
        console.error("Get Owner Requests Error:", error);
        res.status(403).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// GET OWNER CONFIRMED
// ==========================================
const getOwnerConfirmed = async (req, res) => {
    try {
        const confirmed = await bookingService.getOwnerConfirmed(req.user);
        res.status(200).json({
            success: true,
            count: confirmed.length,
            confirmed
        });
    } catch (error) {
        console.error("Get Owner Confirmed Error:", error);
        res.status(403).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// GET OWNER COMPLETED
// ==========================================
const getOwnerCompleted = async (req, res) => {
    try {
        const completed = await bookingService.getOwnerCompleted(req.user);
        res.status(200).json({
            success: true,
            count: completed.length,
            completed
        });
    } catch (error) {
        console.error("Get Owner Completed Error:", error);
        res.status(403).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// GET OWNER STATS
// ==========================================
const getOwnerStats = async (req, res) => {
    try {
        const stats = await bookingService.getOwnerStats(req.user);
        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error("Get Owner Stats Error:", error);
        res.status(403).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// GET OWNER EARNINGS
// ==========================================
const getOwnerEarnings = async (req, res) => {
    try {
        const earnings = await bookingService.getOwnerEarnings(req.user);
        res.status(200).json({
            success: true,
            earnings
        });
    } catch (error) {
        console.error("Get Owner Earnings Error:", error);
        res.status(403).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// GET USER BOOKINGS (CLIENT)
// ==========================================
const getUserBookings = async (req, res) => {
    try {
        const bookings = await bookingService.getUserBookings(req.user);
        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.error("Get User Bookings Error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// GET BOOKING BY ID
// ==========================================
const getBookingById = async (req, res) => {
    try {
        const booking = await bookingService.getBookingById(req.params.id, req.user);
        res.status(200).json({
            success: true,
            booking
        });
    } catch (error) {
        console.error("Get Booking By ID Error:", error);
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// ACCEPT / APPROVE BOOKING (OWNER)
// ==========================================
const acceptBooking = async (req, res) => {
    try {
        const booking = await bookingService.acceptBooking(req.params.id, req.user);
        res.status(200).json({
            success: true,
            message: "Payment verified and booking confirmed successfully",
            booking
        });
    } catch (error) {
        console.error("Accept Booking Error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// REJECT BOOKING REQUEST (OWNER)
// ==========================================
const rejectBooking = async (req, res) => {
    try {
        const { rejectionReason } = req.body;
        const booking = await bookingService.rejectBooking(req.params.id, rejectionReason, req.user);
        res.status(200).json({
            success: true,
            message: "Booking request rejected and reservation released",
            booking
        });
    } catch (error) {
        console.error("Reject Booking Error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// CANCEL BOOKING (CLIENT / OWNER)
// ==========================================
const cancelBooking = async (req, res) => {
    try {
        const { cancellationReason, cancellationTimestamp } = req.body;
        const booking = await bookingService.cancelBooking(
            req.params.id,
            cancellationReason,
            req.user,
            cancellationTimestamp
        );
        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            booking
        });
    } catch (error) {
        console.error("Cancel Booking Error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// COMPLETE REFUND (OWNER)
// ==========================================
const completeRefund = async (req, res) => {
    try {
        const booking = await bookingService.completeRefund(req.params.id, req.body, req.user);
        res.status(200).json({
            success: true,
            message: "Refund settlement completed successfully",
            booking
        });
    } catch (error) {
        console.error("Complete Refund Error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// COMPLETE BOOKING
// ==========================================
const completeBooking = async (req, res) => {
    try {
        const booking = await bookingService.completeBooking(req.params.id, req.user);
        res.status(200).json({
            success: true,
            message: "Booking marked as completed",
            booking
        });
    } catch (error) {
        console.error("Complete Booking Error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
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
};
