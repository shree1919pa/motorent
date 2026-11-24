import api from "./api";

export const getDashboardStats = async () => {
    const response = await api.get("/admin/dashboard");
    return response.data;
};

// ==========================================
// CLIENTS
// ==========================================

export const getClients = async (params = {}) => {
    const response = await api.get("/admin/clients", { params });
    return response.data;
};

export const getClientById = async (id) => {
    const response = await api.get(`/admin/clients/${id}`);
    return response.data;
};

export const approveClient = async (id) => {
    const response = await api.put(`/admin/clients/${id}/approve`);
    return response.data;
};

export const rejectClient = async (id) => {
    const response = await api.put(`/admin/clients/${id}/reject`);
    return response.data;
};

export const suspendClient = async (id) => {
    const response = await api.put(`/admin/clients/${id}/suspend`);
    return response.data;
};

export const activateClient = async (id) => {
    const response = await api.put(`/admin/clients/${id}/activate`);
    return response.data;
};

// ==========================================
// OWNERS
// ==========================================

export const getOwners = async (params = {}) => {
    const response = await api.get("/admin/owners", { params });
    return response.data;
};

export const getOwnerById = async (id) => {
    const response = await api.get(`/admin/owners/${id}`);
    return response.data;
};

export const approveOwner = async (id) => {
    const response = await api.put(`/admin/owners/${id}/approve`);
    return response.data;
};

export const rejectOwner = async (id) => {
    const response = await api.put(`/admin/owners/${id}/reject`);
    return response.data;
};

export const suspendOwner = async (id) => {
    const response = await api.put(`/admin/owners/${id}/suspend`);
    return response.data;
};

export const activateOwner = async (id) => {
    const response = await api.put(`/admin/owners/${id}/activate`);
    return response.data;
};

// ==========================================
// BIKES APPROVAL
// ==========================================

export const getAdminBikes = async (params = {}) => {
    const response = await api.get("/admin/bikes", { params });
    return response.data;
};

export const getAdminBikeById = async (id) => {
    const response = await api.get(`/admin/bikes/${id}`);
    return response.data;
};

export const approveBike = async (id) => {
    const response = await api.put(`/admin/bikes/${id}/approve`);
    return response.data;
};

export const rejectBike = async (id) => {
    const response = await api.put(`/admin/bikes/${id}/reject`);
    return response.data;
};

// ==========================================
// PENDING APPROVALS
// ==========================================

export const getPendingApprovals = async (params = {}) => {
    const response = await api.get("/admin/pending-approvals", { params });
    return response.data;
};

export const getPendingClients = async (params = {}) => {
    const response = await api.get("/admin/pending-clients", { params });
    return response.data;
};

export const getPendingOwners = async (params = {}) => {
    const response = await api.get("/admin/pending-owners", { params });
    return response.data;
};

export const getPendingBikes = async (params = {}) => {
    const response = await api.get("/admin/pending-bikes", { params });
    return response.data;
};

// ==========================================
// GENERIC USER APPROVAL / REJECT
// ==========================================

export const approveUser = async (id) => {
    const response = await api.put(`/admin/users/${id}/approve`);
    return response.data;
};

export const rejectUser = async (id) => {
    const response = await api.put(`/admin/users/${id}/reject`);
    return response.data;
};

// ==========================================
// BLOCK / UNBLOCK
// ==========================================

export const blockClient = async (id, reason = "") => {
    const response = await api.put(`/admin/clients/${id}/block`, { reason });
    return response.data;
};

export const unblockClient = async (id) => {
    const response = await api.put(`/admin/clients/${id}/unblock`);
    return response.data;
};

export const blockOwner = async (id, reason = "") => {
    const response = await api.put(`/admin/owners/${id}/block`, { reason });
    return response.data;
};

export const unblockOwner = async (id) => {
    const response = await api.put(`/admin/owners/${id}/unblock`);
    return response.data;
};

export const blockBike = async (id, reason = "") => {
    const response = await api.put(`/admin/bikes/${id}/block`, { reason });
    return response.data;
};

export const unblockBike = async (id) => {
    const response = await api.put(`/admin/bikes/${id}/unblock`);
    return response.data;
};

const adminService = {
    getDashboardStats,
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
    getAdminBikes,
    getAdminBikeById,
    approveBike,
    rejectBike,
    blockBike,
    unblockBike,
    getPendingApprovals,
    getPendingClients,
    getPendingOwners,
    getPendingBikes,
    approveUser,
    rejectUser,
};

export default adminService;


