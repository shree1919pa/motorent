import axios from "axios";

// Resolve Backend Server URL dynamically from Vite environment variable or local fallback
const rawServerUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    "http://localhost:5000";

// Ensure no trailing slash
export const SERVER_URL = rawServerUrl.replace(/\/$/, "");

// Ensure baseURL points to /api
const getBaseURL = () => {
    if (SERVER_URL.endsWith("/api")) {
        return SERVER_URL;
    }
    return `${SERVER_URL}/api`;
};

const api = axios.create({
    baseURL: getBaseURL(),
});

// Automatically attach Bearer token to all outgoing requests
api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("motorent_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const getImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== "string") return "";
    const trimmed = imagePath.trim();
    if (!trimmed) return "";
    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("data:")
    ) {
        return trimmed;
    }

    // Strip trailing /api if SERVER_URL ended with /api
    const baseHost = SERVER_URL.replace(/\/api$/, "");
    return `${baseHost}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
};

export default api;
