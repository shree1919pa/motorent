const adminService = require("../services/adminService");

// ==========================================
// DASHBOARD
// ==========================================

const getDashboard = async (req, res) => {
    try {
        const data = await adminService.getDashboardStats();
        res.status(200).json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error("Admin Dashboard Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to load dashboard statistics"
        });
    }
};

// ==========================================
// CLIENTS
// ==========================================

const getClients = async (req, res) => {
    try {
        const { status, search } = req.query;
        const clients = await adminService.getClients({ status, search });
        res.status(200).json({
            success: true,
            count: clients.length,
            clients
        });
    } catch (error) {
        console.error("Get Clients Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to load clients"
        });
    }
};

const getClientById = async (req, res) => {
    try {
        const client = await adminService.getClientById(req.params.id);
        res.status(200).json({
            success: true,
            client
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const approveClient = async (req, res) => {
    try {
        const client = await adminService.updateClientStatus(req.params.id, "active");
        res.status(200).json({
            success: true,
            message: "Client approved successfully",
            client
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const rejectClient = async (req, res) => {
    try {
        const client = await adminService.updateClientStatus(req.params.id, "rejected");
        res.status(200).json({
            success: true,
            message: "Client registration rejected",
            client
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const suspendClient = async (req, res) => {
    try {
        const client = await adminService.updateClientStatus(req.params.id, "suspended");
        res.status(200).json({
            success: true,
            message: "Client account suspended",
            client
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const activateClient = async (req, res) => {
    try {
        const client = await adminService.updateClientStatus(req.params.id, "active");
        res.status(200).json({
            success: true,
            message: "Client account activated",
            client
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// OWNERS
// ==========================================

const getOwners = async (req, res) => {
    try {
        const { status, search } = req.query;
        const owners = await adminService.getOwners({ status, search });
        res.status(200).json({
            success: true,
            count: owners.length,
            owners
        });
    } catch (error) {
        console.error("Get Owners Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to load bike owners"
        });
    }
};

const getOwnerById = async (req, res) => {
    try {
        const owner = await adminService.getOwnerById(req.params.id);
        res.status(200).json({
            success: true,
            owner
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const approveOwner = async (req, res) => {
    try {
        const owner = await adminService.updateOwnerStatus(req.params.id, "active");
        res.status(200).json({
            success: true,
            message: "Bike owner approved successfully",
            owner
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const rejectOwner = async (req, res) => {
    try {
        const owner = await adminService.updateOwnerStatus(req.params.id, "rejected");
        res.status(200).json({
            success: true,
            message: "Bike owner registration rejected",
            owner
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const suspendOwner = async (req, res) => {
    try {
        const owner = await adminService.updateOwnerStatus(req.params.id, "suspended");
        res.status(200).json({
            success: true,
            message: "Bike owner account suspended",
            owner
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const activateOwner = async (req, res) => {
    try {
        const owner = await adminService.updateOwnerStatus(req.params.id, "active");
        res.status(200).json({
            success: true,
            message: "Bike owner account activated",
            owner
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// BIKES
// ==========================================

const getBikes = async (req, res) => {
    try {
        const { approvalStatus, status, search } = req.query;
        const bikes = await adminService.getBikes({ approvalStatus, status, search });
        res.status(200).json({
            success: true,
            count: bikes.length,
            bikes
        });
    } catch (error) {
        console.error("Get Admin Bikes Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to load bikes"
        });
    }
};

const getBikeById = async (req, res) => {
    try {
        const bike = await adminService.getBikeById(req.params.id);
        res.status(200).json({
            success: true,
            bike
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const approveBike = async (req, res) => {
    try {
        const bike = await adminService.updateBikeApproval(req.params.id, "approved");
        res.status(200).json({
            success: true,
            message: "Bike approved successfully and now live on catalog",
            bike
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const rejectBike = async (req, res) => {
    try {
        const bike = await adminService.updateBikeApproval(req.params.id, "rejected");
        res.status(200).json({
            success: true,
            message: "Bike listing rejected",
            bike
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// PENDING APPROVALS
// ==========================================

const getPendingApprovals = async (req, res) => {
    try {
        const { search } = req.query;
        const data = await adminService.getPendingApprovals(search);
        res.status(200).json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error("Get Pending Approvals Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to load pending approvals"
        });
    }
};

const getPendingClients = async (req, res) => {
    try {
        const { search } = req.query;
        const clients = await adminService.getPendingClients(search);
        res.status(200).json({
            success: true,
            count: clients.length,
            clients
        });
    } catch (error) {
        console.error("Get Pending Clients Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to load pending clients"
        });
    }
};

const getPendingOwners = async (req, res) => {
    try {
        const { search } = req.query;
        const owners = await adminService.getPendingOwners(search);
        res.status(200).json({
            success: true,
            count: owners.length,
            owners
        });
    } catch (error) {
        console.error("Get Pending Owners Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to load pending owners"
        });
    }
};

const getPendingBikes = async (req, res) => {
    try {
        const { search } = req.query;
        const bikes = await adminService.getPendingBikes(search);
        res.status(200).json({
            success: true,
            count: bikes.length,
            bikes
        });
    } catch (error) {
        console.error("Get Pending Bikes Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to load pending bikes"
        });
    }
};

const approveUser = async (req, res) => {
    try {
        const user = await adminService.updateUserStatusGeneric(req.params.id, "active");
        res.status(200).json({
            success: true,
            message: `${user.role === "owner" ? "Bike owner" : "Client"} approved successfully`,
            user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const rejectUser = async (req, res) => {
    try {
        const user = await adminService.updateUserStatusGeneric(req.params.id, "rejected");
        res.status(200).json({
            success: true,
            message: `${user.role === "owner" ? "Bike owner" : "Client"} registration rejected`,
            user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const blockClient = async (req, res) => {
    try {
        const { reason } = req.body;
        const client = await adminService.blockClient(req.params.id, reason, req.user?.id);
        res.status(200).json({
            success: true,
            message: "Client blocked successfully.",
            client
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const unblockClient = async (req, res) => {
    try {
        const client = await adminService.unblockClient(req.params.id);
        res.status(200).json({
            success: true,
            message: "Client unblocked successfully.",
            client
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const blockOwner = async (req, res) => {
    try {
        const { reason } = req.body;
        const owner = await adminService.blockOwner(req.params.id, reason, req.user?.id);
        res.status(200).json({
            success: true,
            message: "Bike owner blocked successfully.",
            owner
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const unblockOwner = async (req, res) => {
    try {
        const owner = await adminService.unblockOwner(req.params.id);
        res.status(200).json({
            success: true,
            message: "Bike owner unblocked successfully.",
            owner
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const blockBike = async (req, res) => {
    try {
        const { reason } = req.body;
        const bike = await adminService.blockBike(req.params.id, reason, req.user?.id);
        res.status(200).json({
            success: true,
            message: "Bike blocked successfully.",
            bike
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const unblockBike = async (req, res) => {
    try {
        const bike = await adminService.unblockBike(req.params.id);
        res.status(200).json({
            success: true,
            message: "Bike unblocked successfully.",
            bike
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
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
};

