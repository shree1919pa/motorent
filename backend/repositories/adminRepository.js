const User = require("../models/User");
const Bike = require("../models/Bike");

// ==========================================
// CLIENTS
// ==========================================

const getClients = async ({ status, search } = {}) => {
    const filter = { role: "customer" };

    if (status && status !== "all") {
        filter.status = status;
    }

    if (search) {
        const regex = new RegExp(search.trim(), "i");
        filter.$or = [
            { name: regex },
            { email: regex },
            { mobile: regex }
        ];
    }

    return await User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 });
};

// ==========================================
// OWNERS
// ==========================================

const getOwners = async ({ status, search } = {}) => {
    const filter = { role: "owner" };

    if (status && status !== "all") {
        filter.status = status;
    }

    if (search) {
        const regex = new RegExp(search.trim(), "i");
        filter.$or = [
            { name: regex },
            { email: regex },
            { mobile: regex },
            { businessName: regex }
        ];
    }

    const owners = await User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .lean();

    // Attach bike count for each owner
    const ownersWithBikeCount = await Promise.all(
        owners.map(async (owner) => {
            const bikeCount = await Bike.countDocuments({ ownerId: owner._id });
            const pendingBikeCount = await Bike.countDocuments({
                ownerId: owner._id,
                approvalStatus: "pending"
            });
            return {
                ...owner,
                bikeCount,
                pendingBikeCount
            };
        })
    );

    return ownersWithBikeCount;
};

// ==========================================
// BIKES (ADMIN)
// ==========================================

const getBikes = async ({ approvalStatus, status, search } = {}) => {
    const filter = {};

    if (approvalStatus && approvalStatus !== "all") {
        filter.approvalStatus = approvalStatus;
    }

    if (status && status !== "all") {
        filter.status = status;
    }

    if (search) {
        const regex = new RegExp(search.trim(), "i");
        const matchingOwners = await User.find({
            role: "owner",
            $or: [{ name: regex }, { email: regex }, { businessName: regex }]
        }).select("_id");
        const matchingOwnerIds = matchingOwners.map((o) => o._id);

        filter.$or = [
            { bikeName: regex },
            { brand: regex },
            { model: regex },
            { location: regex },
            { type: regex },
            ...(matchingOwnerIds.length > 0 ? [{ ownerId: { $in: matchingOwnerIds } }] : [])
        ];
    }

    return await Bike.find(filter)
        .populate("ownerId", "name email mobile businessName status isBlocked")
        .sort({ createdAt: -1 });
};

// ==========================================
// GET SINGLE USER
// ==========================================

const getUserById = async (id) => {
    const user = await User.findById(id).select("-password").lean();
    if (!user) return null;

    if (user.role === "owner") {
        const bikes = await Bike.find({ ownerId: user._id }).sort({ createdAt: -1 });
        user.bikes = bikes;
        user.bikeCount = bikes.length;
    }

    return user;
};

// ==========================================
// GET SINGLE BIKE
// ==========================================

const getBikeById = async (id) => {
    return await Bike.findById(id)
        .populate("ownerId", "name email mobile businessName address status isBlocked");
};

// ==========================================
// UPDATE USER STATUS
// ==========================================

const updateUserStatus = async (id, status) => {
    return await User.findByIdAndUpdate(
        id,
        { status },
        { returnDocument: "after", runValidators: true }
    ).select("-password");
};

// ==========================================
// BLOCK / UNBLOCK USER
// ==========================================

const blockUser = async (id, reason = "", adminId = null) => {
    return await User.findByIdAndUpdate(
        id,
        {
            status: "blocked",
            isBlocked: true,
            blockReason: reason.trim() || "Administrative action",
            blockedAt: new Date(),
            blockedBy: adminId
        },
        { returnDocument: "after", runValidators: true }
    ).select("-password");
};

const unblockUser = async (id) => {
    return await User.findByIdAndUpdate(
        id,
        {
            status: "active",
            isBlocked: false,
            blockReason: "",
            blockedAt: null,
            blockedBy: null
        },
        { returnDocument: "after", runValidators: true }
    ).select("-password");
};

// ==========================================
// UPDATE BIKE APPROVAL STATUS
// ==========================================

const updateBikeApprovalStatus = async (id, approvalStatus) => {
    return await Bike.findByIdAndUpdate(
        id,
        { approvalStatus },
        { returnDocument: "after", runValidators: true }
    ).populate("ownerId", "name email mobile businessName status");
};

// ==========================================
// BLOCK / UNBLOCK BIKE
// ==========================================

const blockBike = async (id, reason = "", adminId = null) => {
    const existingBike = await Bike.findById(id);
    if (!existingBike) return null;

    const previousApprovalStatus = existingBike.approvalStatus === "blocked" ? "approved" : existingBike.approvalStatus;
    const previousStatus = existingBike.status === "blocked" ? "available" : existingBike.status;

    return await Bike.findByIdAndUpdate(
        id,
        {
            approvalStatus: "blocked",
            status: "unavailable",
            isBlocked: true,
            blockReason: reason.trim() || "Administrative action",
            blockedAt: new Date(),
            blockedBy: adminId,
            previousApprovalStatus,
            previousStatus
        },
        { returnDocument: "after", runValidators: true }
    ).populate("ownerId", "name email mobile businessName status");
};

const unblockBike = async (id) => {
    const existingBike = await Bike.findById(id);
    if (!existingBike) return null;

    const restoredApprovalStatus = existingBike.previousApprovalStatus || "approved";
    const restoredStatus = existingBike.previousStatus || "available";

    return await Bike.findByIdAndUpdate(
        id,
        {
            approvalStatus: restoredApprovalStatus,
            status: restoredStatus,
            isBlocked: false,
            blockReason: "",
            blockedAt: null,
            blockedBy: null
        },
        { returnDocument: "after", runValidators: true }
    ).populate("ownerId", "name email mobile businessName status");
};


// ==========================================
// DASHBOARD STATS
// ==========================================

const getDashboardStats = async () => {
    // Clients
    const totalClients = await User.countDocuments({ role: "customer" });
    const activeClients = await User.countDocuments({ role: "customer", status: "active" });
    const pendingClients = await User.countDocuments({ role: "customer", status: "pending" });
    const suspendedClients = await User.countDocuments({ role: "customer", status: "suspended" });
    const rejectedClients = await User.countDocuments({ role: "customer", status: "rejected" });

    // Owners
    const totalOwners = await User.countDocuments({ role: "owner" });
    const activeOwners = await User.countDocuments({ role: "owner", status: "active" });
    const pendingOwners = await User.countDocuments({ role: "owner", status: "pending" });
    const suspendedOwners = await User.countDocuments({ role: "owner", status: "suspended" });
    const rejectedOwners = await User.countDocuments({ role: "owner", status: "rejected" });

    // Bikes
    const totalBikes = await Bike.countDocuments();
    const approvedBikes = await Bike.countDocuments({ approvalStatus: "approved" });
    const pendingBikes = await Bike.countDocuments({ approvalStatus: "pending" });
    const rejectedBikes = await Bike.countDocuments({ approvalStatus: "rejected" });
    const availableBikes = await Bike.countDocuments({ approvalStatus: "approved", status: "available" });

    // Recent Registrations (latest 8 users)
    const recentRegistrations = await User.find({ role: { $in: ["customer", "owner"] } })
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(8);

    // Pending Approvals List (latest pending items)
    const pendingClientsList = await User.find({ role: "customer", status: "pending" })
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(5);

    const pendingOwnersList = await User.find({ role: "owner", status: "pending" })
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(5);

    const pendingBikesList = await Bike.find({ approvalStatus: "pending" })
        .populate("ownerId", "name email mobile businessName")
        .sort({ createdAt: -1 })
        .limit(5);

    // Recently Added Bikes (latest 6)
    const recentBikes = await Bike.find()
        .populate("ownerId", "name email businessName")
        .sort({ createdAt: -1 })
        .limit(6);

    return {
        summary: {
            clients: {
                total: totalClients,
                active: activeClients,
                pending: pendingClients,
                suspended: suspendedClients,
                rejected: rejectedClients
            },
            owners: {
                total: totalOwners,
                active: activeOwners,
                pending: pendingOwners,
                suspended: suspendedOwners,
                rejected: rejectedOwners
            },
            bikes: {
                total: totalBikes,
                approved: approvedBikes,
                pending: pendingBikes,
                rejected: rejectedBikes,
                available: availableBikes
            },
            pendingTotal: pendingClients + pendingOwners + pendingBikes
        },
        recentRegistrations,
        pendingApprovals: {
            clients: pendingClientsList,
            owners: pendingOwnersList,
            bikes: pendingBikesList
        },
        recentBikes
    };
};

// ==========================================
// PENDING APPROVALS
// ==========================================

const getPendingClients = async (search) => {
    const filter = { role: "customer", status: "pending" };
    if (search) {
        const regex = new RegExp(search.trim(), "i");
        filter.$or = [
            { name: regex },
            { email: regex },
            { mobile: regex }
        ];
    }
    return await User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 });
};

const getPendingOwners = async (search) => {
    const filter = { role: "owner", status: "pending" };
    if (search) {
        const regex = new RegExp(search.trim(), "i");
        filter.$or = [
            { name: regex },
            { email: regex },
            { mobile: regex },
            { businessName: regex }
        ];
    }
    const owners = await User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .lean();

    return await Promise.all(
        owners.map(async (owner) => {
            const bikeCount = await Bike.countDocuments({ ownerId: owner._id });
            return {
                ...owner,
                bikeCount
            };
        })
    );
};

const getPendingBikes = async (search) => {
    const filter = { approvalStatus: "pending" };
    if (search) {
        const regex = new RegExp(search.trim(), "i");
        filter.$or = [
            { bikeName: regex },
            { brand: regex },
            { model: regex },
            { location: regex },
            { type: regex }
        ];
    }
    return await Bike.find(filter)
        .populate("ownerId", "name email mobile businessName status")
        .sort({ createdAt: -1 });
};

const getPendingApprovalsData = async (search) => {
    const [clients, owners, bikes] = await Promise.all([
        getPendingClients(search),
        getPendingOwners(search),
        getPendingBikes(search)
    ]);

    // Summary counts (unfiltered by search for total accuracy)
    const [pendingClientsCount, pendingOwnersCount, pendingBikesCount] = await Promise.all([
        User.countDocuments({ role: "customer", status: "pending" }),
        User.countDocuments({ role: "owner", status: "pending" }),
        Bike.countDocuments({ approvalStatus: "pending" })
    ]);

    return {
        summary: {
            clients: pendingClientsCount,
            owners: pendingOwnersCount,
            bikes: pendingBikesCount,
            total: pendingClientsCount + pendingOwnersCount + pendingBikesCount
        },
        clients,
        owners,
        bikes
    };
};

module.exports = {
    getClients,
    getOwners,
    getBikes,
    getUserById,
    getBikeById,
    updateUserStatus,
    blockUser,
    unblockUser,
    updateBikeApprovalStatus,
    blockBike,
    unblockBike,
    getDashboardStats,
    getPendingClients,
    getPendingOwners,
    getPendingBikes,
    getPendingApprovalsData
};

