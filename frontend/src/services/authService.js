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
    const response = await api.post("/users/register", userData);
    return response.data;
};

const getProfile = async () => {
    const response = await api.get("/users/profile");
    return response.data;
};

const updateProfile = async (profileData) => {
    const response = await api.put("/users/profile", profileData);
    return response.data;
};

export default {
    login,
    logout,
    register,
    getProfile,
    updateProfile
};
