import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    Bike,
    CalendarDays,
    User,
    LogOut,
    Menu,
    X,
    Shield,
    Compass,
    Sparkles
} from "lucide-react";
import useAuth from "../../context/useAuth";
import NotificationBell from "../NotificationBell";
import "./CustomerNavbar.css";

const CustomerNavbar = ({ activePage = "" }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, isOwner, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login", { replace: true });
        } catch (err) {
            console.error("Logout failed:", err);
            navigate("/login", { replace: true });
        }
    };

    const currentPath = location.pathname;
    const isExploreActive = activePage === "explore" || currentPath === "/" || currentPath.startsWith("/dashboard") || currentPath.startsWith("/browse");
    const isBookingsActive = activePage === "bookings" || currentPath.startsWith("/bookings") || currentPath.startsWith("/my-bookings");
    const isProfileActive = activePage === "profile" || currentPath.startsWith("/client/profile") || currentPath.startsWith("/profile");

    return (
        <header className="customer-navbar-header">
            <div className="customer-navbar-container">
                {/* BRAND LOGO */}
                <Link to="/dashboard" className="customer-brand" onClick={() => setMobileOpen(false)}>
                    <div className="brand-logo-mark">
                        <span className="brand-icon">🏍️</span>
                    </div>
                    <div className="brand-text">
                        <span className="brand-moto">Moto</span>
                        <span className="brand-rent">Rent</span>
                    </div>
                </Link>

                {/* DESKTOP NAV LINKS */}
                <nav className="customer-nav-center">
                    <Link
                        to="/dashboard"
                        className={`customer-nav-link ${isExploreActive ? "active" : ""}`}
                    >
                        <Compass size={17} />
                        <span>Explore Bikes</span>
                        {isExploreActive && <span className="nav-active-pip" />}
                    </Link>

                    {isAuthenticated && !isOwner && (
                        <Link
                            to="/bookings"
                            className={`customer-nav-link ${isBookingsActive ? "active" : ""}`}
                        >
                            <CalendarDays size={17} />
                            <span>My Bookings</span>
                            {isBookingsActive && <span className="nav-active-pip" />}
                        </Link>
                    )}

                    {isOwner && (
                        <Link to="/owner/dashboard" className="owner-portal-shortcut">
                            <Sparkles size={14} /> Owner Portal →
                        </Link>
                    )}
                </nav>

                {/* RIGHT ACTIONS */}
                <div className="customer-nav-actions">
                    {isAuthenticated ? (
                        <>
                            <NotificationBell />

                            <Link
                                to="/client/profile"
                                className={`customer-profile-pill ${isProfileActive ? "active" : ""}`}
                                title="View & Edit Profile / Driving Licence"
                            >
                                <div className="profile-avatar-circle">
                                    <User size={15} />
                                </div>
                                <span className="profile-pill-name">{user?.name || "My Profile"}</span>
                            </Link>

                            <button
                                type="button"
                                className="customer-logout-btn"
                                onClick={handleLogout}
                                title="Sign out securely"
                                aria-label="Sign out"
                            >
                                <LogOut size={16} />
                            </button>
                        </>
                    ) : (
                        <div className="customer-guest-actions">
                            <Link to="/login" className="customer-btn-login">
                                Log In
                            </Link>
                            <Link to="/register" className="customer-btn-register">
                                Get Started
                            </Link>
                        </div>
                    )}

                    {/* MOBILE HAMBURGER BUTTON */}
                    <button
                        type="button"
                        className="customer-mobile-toggle"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle Navigation Menu"
                    >
                        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* MOBILE MENU DROPDOWN */}
            {mobileOpen && (
                <div className="customer-mobile-menu">
                    <Link
                        to="/dashboard"
                        className={`mobile-menu-item ${isExploreActive ? "active" : ""}`}
                        onClick={() => setMobileOpen(false)}
                    >
                        <Compass size={18} />
                        <span>Explore Bikes</span>
                    </Link>

                    {isAuthenticated && !isOwner && (
                        <Link
                            to="/bookings"
                            className={`mobile-menu-item ${isBookingsActive ? "active" : ""}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <CalendarDays size={18} />
                            <span>My Bookings</span>
                        </Link>
                    )}

                    {isOwner && (
                        <Link
                            to="/owner/dashboard"
                            className="mobile-menu-item owner-highlight"
                            onClick={() => setMobileOpen(false)}
                        >
                            <Sparkles size={18} />
                            <span>Owner Dashboard</span>
                        </Link>
                    )}

                    {isAuthenticated ? (
                        <>
                            <Link
                                to="/client/profile"
                                className={`mobile-menu-item ${isProfileActive ? "active" : ""}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <User size={18} />
                                <span>Profile & Licence ({user?.name || "Customer"})</span>
                            </Link>

                            <button
                                type="button"
                                className="mobile-menu-item logout"
                                onClick={() => {
                                    setMobileOpen(false);
                                    handleLogout();
                                }}
                            >
                                <LogOut size={18} />
                                <span>Sign Out</span>
                            </button>
                        </>
                    ) : (
                        <div className="mobile-guest-buttons">
                            <Link
                                to="/login"
                                className="mobile-btn login"
                                onClick={() => setMobileOpen(false)}
                            >
                                Log In
                            </Link>
                            <Link
                                to="/register"
                                className="mobile-btn register"
                                onClick={() => setMobileOpen(false)}
                            >
                                Create Account
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};

export default CustomerNavbar;
