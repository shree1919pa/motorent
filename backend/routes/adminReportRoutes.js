const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getSummary,
    getClientReports,
    getOwnerReports,
    getApprovalAnalytics,
    getBikeReports,
    getBookingReports,
    getPaymentReports,
    getBlockedAndRejectedReports,
    exportClientsExcel,
    exportOwnersExcel,
    exportCompleteExcel
} = require("../controllers/adminReportController");

const router = express.Router();

// ==========================================
// ADMIN AUTH & ROLE PROTECTION
// ==========================================
router.use(protect);
router.use(authorize("admin"));

// ==========================================
// REPORT ANALYTICS APIS
// ==========================================
router.get("/summary", getSummary);
router.get("/clients", getClientReports);
router.get("/owners", getOwnerReports);
router.get("/analytics", getApprovalAnalytics);
router.get("/bikes", getBikeReports);
router.get("/bookings", getBookingReports);
router.get("/payments", getPaymentReports);
router.get("/blocked-rejected", getBlockedAndRejectedReports);

// ==========================================
// EXCEL EXPORT APIS
// ==========================================
router.get("/export/clients", exportClientsExcel);
router.get("/export/owners", exportOwnersExcel);
router.get("/export/complete", exportCompleteExcel);

module.exports = router;
