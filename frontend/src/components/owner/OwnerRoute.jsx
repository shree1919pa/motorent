import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../../context/useAuth";

const OwnerRoute = ({ children }) => {
    const { user, token } = useAuth();
    const location = useLocation();

    // Prevent back-forward cache (bfcache) from revealing protected pages after logout
    useEffect(() => {
        const handlePageShow = (e) => {
            if (e.persisted) {
                const currentToken =
                    localStorage.getItem("token") ||
                    localStorage.getItem("motorent_token");
                if (!currentToken) {
                    window.location.replace("/login");
                }
            }
        };
        window.addEventListener("pageshow", handlePageShow);
        return () => window.removeEventListener("pageshow", handlePageShow);
    }, []);

    const storedUser =
        user ||
        (() => {
            try {
                const raw =
                    localStorage.getItem("user") ||
                    localStorage.getItem("motorent_user");
                return raw ? JSON.parse(raw) : null;
            } catch {
                return null;
            }
        })();

    const storedToken =
        token ||
        localStorage.getItem("token") ||
        localStorage.getItem("motorent_token");

    if (!storedToken || !storedUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (storedUser.role !== "owner" && storedUser.role !== "admin") {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default OwnerRoute;
