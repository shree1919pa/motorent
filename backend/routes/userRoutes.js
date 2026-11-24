const express = require("express");

const {
    register,
    login,
    logout,
    getProfile,
    updateProfile
} = require("../controllers/userController");

const {
    getClients,
    approveClient,
    rejectClient,
    blockClient,
    unblockClient
} = require("../controllers/adminController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// ==========================================
// PUBLIC AUTH ROUTES
// ==========================================
router.post(
    "/register",
    upload.fields([
        { name: "drivingLicenseImage", maxCount: 1 },
        { name: "qrCode", maxCount: 1 }
    ]),
    register
);

router.post(
    "/login",
    login
);

router.post(
    "/logout",
    logout
);

// ==========================================
// CLIENT / USER PROFILE
// ==========================================
router.get(
    "/profile",
    protect,
    getProfile
);

router.put(
    "/profile",
    protect,
    upload.fields([
        { name: "drivingLicenseImage", maxCount: 1 },
        { name: "qrCode", maxCount: 1 },
        { name: "profileImage", maxCount: 1 }
    ]),
    updateProfile
);

// ==========================================
// ADMIN CLIENT MANAGEMENT ROUTES
// ==========================================
router.get(
    "/clients",
    protect,
    authorize("admin"),
    getClients
);

router.put(
    "/:id/approve",
    protect,
    authorize("admin"),
    approveClient
);

router.put(
    "/:id/reject",
    protect,
    authorize("admin"),
    rejectClient
);

router.put(
    "/:id/block",
    protect,
    authorize("admin"),
    blockClient
);

router.put(
    "/:id/unblock",
    protect,
    authorize("admin"),
    unblockClient
);

module.exports = router;
