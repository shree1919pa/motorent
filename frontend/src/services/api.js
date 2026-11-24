import axios from "axios";

/**
 * MotoRent API Client Configuration
 * Supports dynamic Vite environment variables for production (Render) and development.
 */

// Production backend default fallback if not specified in env
const PRODUCTION_BACKEND_DEFAULT = "https://motorent-backend.onrender.com";

// Resolve Raw Server URL from Vite environment variables with fallbacks
const rawUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    (import.meta.env.PROD ? PRODUCTION_BACKEND_DEFAULT : "http://localhost:5000");

// Normalize: remove trailing slashes
const normalizedUrl = (typeof rawUrl === "string" ? rawUrl : "http://localhost:5000")
    .trim()
    .replace(/\/+$/, "");

// Automatically append /api exactly once
export const SERVER_URL = normalizedUrl.endsWith("/api")
    ? normalizedUrl.slice(0, -4)
    : normalizedUrl;

export const API_BASE_URL = `${SERVER_URL}/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30-second timeout to handle Render free-tier cold starts
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

// Response interceptor for request timeout and error diagnostics
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
            console.warn(
                "[MotoRent API] Request timed out after 30 seconds. If the backend is running on Render's free tier, it may be waking up from sleep. Please try again in a few moments."
            );
        }
        return Promise.reject(error);
    }
);

/**
 * Resolves complete image URLs for Cloudinary, external URLs, data URLs,
 * and backend-hosted static files in /uploads/.
 */
export const getImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== "string") return "";
    const trimmed = imagePath.trim();
    if (!trimmed) return "";

    // Cloudinary, CDN, external URLs, and data URIs
    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("data:")
    ) {
        return trimmed;
    }

    // Relative backend uploads (clean slash joining)
    return `${SERVER_URL}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
};

export default api;
