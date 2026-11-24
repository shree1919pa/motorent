const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getDashboard,
    getClients,
    getClientById,
    approveClient,
    rejectClient,
    suspendClient,
    activateClient,
    blockClient,
    unblockClient,
    getOwners,
    getOwnerById,
    approveOwner,
    rejectOwner,
    suspendOwner,
    activateOwner,
    blockOwner,
    unblockOwner,
    getBikes,
    getBikeById,
    approveBike,
    rejectBike,
    blockBike,
    unblockBike,
    getPendingApprovals,
    getPendingClients,
    getPendingOwners,
    getPendingBikes,
    approveUser,
    rejectUser
} = require("../controllers/adminController");

const adminReportRoutes = require("./adminReportRoutes");

const router = express.Router();

// ==========================================
// ADMIN AUTH & ROLE PROTECTION
// ==========================================
router.use(protect);
router.use(authorize("admin"));

// ==========================================
// REPORTS & ANALYTICS
// ==========================================
router.use("/reports", adminReportRoutes);

// ==========================================
// DASHBOARD
// ==========================================
router.get("/dashboard", getDashboard);

// ==========================================
// PENDING APPROVALS
// ==========================================
router.get("/pending-approvals", getPendingApprovals);
router.get("/pending-clients", getPendingClients);
router.get("/pending-owners", getPendingOwners);
router.get("/pending-bikes", getPendingBikes);

// ==========================================
// GENERIC USER APPROVAL / REJECT
// ==========================================
router.put("/users/:id/approve", approveUser);
router.put("/users/:id/reject", rejectUser);

// ==========================================
// CLIENTS
// ==========================================
router.get("/clients", getClients);
router.get("/clients/:id", getClientById);
router.put("/clients/:id/approve", approveClient);
router.put("/clients/:id/reject", rejectClient);
router.put("/clients/:id/suspend", suspendClient);
router.put("/clients/:id/activate", activateClient);
router.put("/clients/:id/block", blockClient);
router.put("/clients/:id/unblock", unblockClient);

// ==========================================
// BIKE OWNERS
// ==========================================
router.get("/owners", getOwners);
router.get("/owners/:id", getOwnerById);
router.put("/owners/:id/approve", approveOwner);
router.put("/owners/:id/reject", rejectOwner);
router.put("/owners/:id/suspend", suspendOwner);
router.put("/owners/:id/activate", activateOwner);
router.put("/owners/:id/block", blockOwner);
router.put("/owners/:id/unblock", unblockOwner);

// ==========================================
// BIKES APPROVAL & MANAGEMENT
// ==========================================
router.get("/bikes", getBikes);
router.get("/bikes/:id", getBikeById);
router.put("/bikes/:id/approve", approveBike);
router.put("/bikes/:id/reject", rejectBike);
router.put("/bikes/:id/block", blockBike);
router.put("/bikes/:id/unblock", unblockBike);

module.exports = router;


