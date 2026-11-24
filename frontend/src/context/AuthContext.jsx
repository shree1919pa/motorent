import { useState, useEffect } from "react";
import { AuthContext } from "./authContextInstance";
import authService from "../services/authService";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser =
            localStorage.getItem("user") ||
            localStorage.getItem("motorent_user");

        if (!savedUser) return null;
        try {
            return JSON.parse(savedUser);
        } catch {
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("motorent_token") ||
            null
        );
    });

    // Check token validity on mount / storage changes
    useEffect(() => {
        const handleStorageChange = () => {
            const currentToken = localStorage.getItem("token") || localStorage.getItem("motorent_token");
            const currentUser = localStorage.getItem("user") || localStorage.getItem("motorent_user");
            setToken(currentToken);
            try {
                setUser(currentUser ? JSON.parse(currentUser) : null);
            } catch {
                setUser(null);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const login = async (email, password) => {
        const data = await authService.login(email, password);

        // Store consistently across keys
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("motorent_token", data.token);
        localStorage.setItem("motorent_user", JSON.stringify(data.user));

        setToken(data.token);
        setUser(data.user);

        return data;
    };

    // FEATURE 1: Secure Logout
    const logout = async () => {
        try {
            await authService.logout();
        } catch {
            // Silently continue local clearance
        }

        // 1. Clear authentication tokens and session info
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("motorent_token");
        localStorage.removeItem("motorent_user");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        localStorage.removeItem("motorent_login_email");
        localStorage.removeItem("motorent_saved_email");

        sessionStorage.clear();

        setToken(null);
        setUser(null);
    };

    const isAuthenticated = !!token;
    const isOwner = user?.role === "owner";
    const isAdmin = user?.role === "admin";
    const isCustomer = user?.role === "customer";

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAuthenticated,
                isOwner,
                isAdmin,
                isCustomer,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
