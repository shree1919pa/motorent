import api from "./api";

export const createBooking = async (bookingData) => {
    const response = await api.post("/bookings", bookingData);
    return response.data;
};

export const getMyBookings = async () => {
    const response = await api.get("/bookings/my");
    return response.data;
};

export const getOwnerBookings = async (status = null) => {
    const params = status && status !== "all" ? { status } : {};
    const response = await api.get("/bookings/owner", { params });
    return response.data;
};

export const getOwnerRequests = async () => {
    const response = await api.get("/bookings/owner/requests");
    return response.data;
};

export const getOwnerConfirmed = async () => {
    const response = await api.get("/bookings/owner/confirmed");
    return response.data;
};

export const getOwnerCompleted = async () => {
    const response = await api.get("/bookings/owner/completed");
    return response.data;
};

export const getOwnerStats = async () => {
    const response = await api.get("/bookings/owner/stats");
    return response.data;
};

export const getOwnerEarnings = async () => {
    const response = await api.get("/bookings/owner/earnings");
    return response.data;
};

export const getBookingById = async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
};

export const acceptBooking = async (id) => {
    const response = await api.put(`/bookings/${id}/accept`);
    return response.data;
};

export const rejectBooking = async (id, rejectionReason = "") => {
    const response = await api.put(`/bookings/${id}/reject`, { rejectionReason });
    return response.data;
};

export const cancelBooking = async (id, cancellationReason = "") => {
    const response = await api.put(`/bookings/${id}/cancel`, { cancellationReason });
    return response.data;
};

export const completeRefund = async (id, refundData = {}) => {
    const response = await api.put(`/bookings/${id}/refund`, refundData);
    return response.data;
};

export const completeBooking = async (id) => {
    const response = await api.put(`/bookings/${id}/complete`);
    return response.data;
};

const bookingService = {
    createBooking,
    getMyBookings,
    getOwnerBookings,
    getOwnerRequests,
    getOwnerConfirmed,
    getOwnerCompleted,
    getOwnerStats,
    getOwnerEarnings,
    getBookingById,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    completeRefund,
    completeBooking
};

export default bookingService;
