import api from "./api";

const login = async (email, password) => {
    const response = await api.post("/users/login", {
        email,
        password,
    });
    return response.data;
};

const logout = async () => {
    try {
        const response = await api.post("/users/logout");
        return response.data;
    } catch {
        return { success: true };
    }
};

const register = async (userData) => {
    const isFormData = userData instanceof FormData;
    const response = await api.post("/users/register", userData, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : {}
    });
    return response.data;
};

const getProfile = async () => {
    const response = await api.get("/users/profile");
    return response.data;
};

const updateProfile = async (profileData) => {
    const isFormData = profileData instanceof FormData;
    const response = await api.put("/users/profile", profileData, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : {}
    });
    return response.data;
};

export default {
    login,
    logout,
    register,
    getProfile,
    updateProfile
};
