const mongoose = require("mongoose");
const adminRepository = require("../repositories/adminRepository");

// ==========================================
// DASHBOARD
// ==========================================

const getDashboardStats = async () => {
    return await adminRepository.getDashboardStats();
};

// ==========================================
// CLIENTS
// ==========================================

const getClients = async (query = {}) => {
    return await adminRepository.getClients(query);
};

const getClientById = async (id) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid client ID");
    }

    const client = await adminRepository.getUserById(id);
    if (!client || client.role !== "customer") {
        throw new Error("Client not found");
    }

    return client;
};

const updateClientStatus = async (id, status) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid client ID");
    }

    const validStatuses = ["pending", "active", "rejected", "suspended"];
    if (!validStatuses.includes(status)) {
        throw new Error("Invalid status value");
    }

    const client = await adminRepository.getUserById(id);
    if (!client || client.role !== "customer") {
        throw new Error("Client not found");
    }

    return await adminRepository.updateUserStatus(id, status);
};

// ==========================================
// OWNERS
// ==========================================

const getOwners = async (query = {}) => {
    return await adminRepository.getOwners(query);
};

const getOwnerById = async (id) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid owner ID");
    }

    const owner = await adminRepository.getUserById(id);
    if (!owner || owner.role !== "owner") {
        throw new Error("Owner not found");
    }

    return owner;
};

const updateOwnerStatus = async (id, status) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid owner ID");
    }

    const validStatuses = ["pending", "active", "rejected", "suspended"];
    if (!validStatuses.includes(status)) {
        throw new Error("Invalid status value");
    }

    const owner = await adminRepository.getUserById(id);
    if (!owner || owner.role !== "owner") {
        throw new Error("Owner not found");
    }

    return await adminRepository.updateUserStatus(id, status);
};

// ==========================================
// BIKES
// ==========================================

const getBikes = async (query = {}) => {
    return await adminRepository.getBikes(query);
};

const getBikeById = async (id) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid bike ID");
    }

    const bike = await adminRepository.getBikeById(id);
    if (!bike) {
        throw new Error("Bike not found");
    }

    return bike;
};

const updateBikeApproval = async (id, approvalStatus) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid bike ID");
    }

    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(approvalStatus)) {
        throw new Error("Invalid approval status");
    }

    const bike = await adminRepository.getBikeById(id);
    if (!bike) {
        throw new Error("Bike not found");
    }

    return await adminRepository.updateBikeApprovalStatus(id, approvalStatus);
};

// ==========================================
// PENDING APPROVALS
// ==========================================

const getPendingApprovals = async (search) => {
    return await adminRepository.getPendingApprovalsData(search);
};

const getPendingClients = async (search) => {
    return await adminRepository.getPendingClients(search);
};

const getPendingOwners = async (search) => {
    return await adminRepository.getPendingOwners(search);
};

const getPendingBikes = async (search) => {
    return await adminRepository.getPendingBikes(search);
};

// ==========================================
// BLOCK / UNBLOCK
// ==========================================

const blockClient = async (id, reason = "", adminId = null) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid client ID");
    }
    const client = await adminRepository.getUserById(id);
    if (!client || client.role !== "customer") {
        throw new Error("Client not found");
    }
    return await adminRepository.blockUser(id, reason, adminId);
};

const unblockClient = async (id) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid client ID");
    }
    const client = await adminRepository.getUserById(id);
    if (!client || client.role !== "customer") {
        throw new Error("Client not found");
    }
    return await adminRepository.unblockUser(id);
};

const blockOwner = async (id, reason = "", adminId = null) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid owner ID");
    }
    const owner = await adminRepository.getUserById(id);
    if (!owner || owner.role !== "owner") {
        throw new Error("Owner not found");
    }
    return await adminRepository.blockUser(id, reason, adminId);
};

const unblockOwner = async (id) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid owner ID");
    }
    const owner = await adminRepository.getUserById(id);
    if (!owner || owner.role !== "owner") {
        throw new Error("Owner not found");
    }
    return await adminRepository.unblockUser(id);
};

const blockBike = async (id, reason = "", adminId = null) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid bike ID");
    }
    const bike = await adminRepository.getBikeById(id);
    if (!bike) {
        throw new Error("Bike not found");
    }
    return await adminRepository.blockBike(id, reason, adminId);
};

const unblockBike = async (id) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid bike ID");
    }
    const bike = await adminRepository.getBikeById(id);
    if (!bike) {
        throw new Error("Bike not found");
    }
    return await adminRepository.unblockBike(id);
};

const updateUserStatusGeneric = async (id, status) => {

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid user ID");
    }

    const validStatuses = ["pending", "active", "rejected", "suspended", "blocked"];
    if (!validStatuses.includes(status)) {
        throw new Error("Invalid status value");
    }

    const user = await adminRepository.getUserById(id);
    if (!user) {
        throw new Error("User not found");
    }

    return await adminRepository.updateUserStatus(id, status);
};

module.exports = {

    getDashboardStats,
    getClients,
    getClientById,
    updateClientStatus,
    blockClient,
    unblockClient,
    getOwners,
    getOwnerById,
    updateOwnerStatus,
    blockOwner,
    unblockOwner,
    getBikes,
    getBikeById,
    updateBikeApproval,
    blockBike,
    unblockBike,
    getPendingApprovals,
    getPendingClients,
    getPendingOwners,
    getPendingBikes,
    updateUserStatusGeneric
};

