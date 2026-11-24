import api from "./api";

export const getAllBikes = async () => {
    const response = await api.get("/bikes");
    return response.data;
};

export const getOwnerBikes = async () => {
    const response = await api.get("/bikes/owner");
    return response.data;
};

export const getBikeById = async (id) => {
    const response = await api.get(`/bikes/${id}`);
    return response.data;
};

export const createBike = async (bikeData) => {
    const response = await api.post("/bikes", bikeData);
    return response.data;
};

export const updateBike = async (id, bikeData) => {
    const response = await api.put(`/bikes/${id}`, bikeData);
    return response.data;
};

export const deleteBike = async (id) => {
    const response = await api.delete(`/bikes/${id}`);
    return response.data;
};

export const searchBikes = async (params) => {
    const response = await api.get("/bikes/search", { params });
    return response.data;
};

export const checkBikeAvailability = async (id, startDate, endDate) => {
    const response = await api.get(`/bikes/${id}/availability`, {
        params: { startDate, endDate }
    });
    return response.data;
};

const bikeService = {
    getAllBikes,
    getOwnerBikes,
    getBikeById,
    createBike,
    updateBike,
    deleteBike,
    searchBikes,
    checkBikeAvailability
};

export default bikeService;
