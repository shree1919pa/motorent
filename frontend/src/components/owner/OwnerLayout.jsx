import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Bike,
    PlusCircle,
    Inbox,
    CalendarCheck,
    Wallet,
    User,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Bell
} from "lucide-react";
import useAuth from "../../context/useAuth";
import bookingService from "../../services/bookingService";
import NotificationBell from "../NotificationBell";
import "./OwnerLayout.css";

const OwnerLayout = ({ children, activePage = "" }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    const currentUser = user || (() => {
        try {
            const raw = localStorage.getItem("user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    useEffect(() => {
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("motorent_token");

        if (!token || !currentUser) {
            navigate("/login");
            return;
        }

        if (currentUser.role !== "owner" && currentUser.role !== "admin") {
            navigate("/login");
            return;
        }

        // Fetch pending requests count
        const fetchPending = async () => {
            try {
                const res = await bookingService.getOwnerRequests();
                if (res && res.requests) {
                    setPendingCount(res.requests.length);
                }
            } catch (err) {
                // Silently ignore
            }
        };

        fetchPending();
        const interval = setInterval(fetchPending, 15000);
        return () => clearInterval(interval);
    }, [currentUser, navigate]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const navItems = [
        {
            path: "/owner/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
            key: "dashboard"
        },
        {
            path: "/owner/bikes",
            label: "My Bikes",
            icon: Bike,
            key: "bikes"
        },
        {
            path: "/owner/bikes/add",
            label: "Add New Bike",
            icon: PlusCircle,
            key: "add-bike"
        },
        {
            path: "/owner/booking-requests",
            label: "Advance Payment Verification",
            icon: Inbox,
            badge: pendingCount,
            key: "booking-requests"
        },
        {
            path: "/owner/bookings",
            label: "Bookings",
            icon: CalendarCheck,
            key: "bookings"
        },
        {
            path: "/owner/earnings",
            label: "Earnings",
            icon: Wallet,
            key: "earnings"
        },
        {
            path: "/owner/profile",
            label: "Profile",
            icon: User,
            key: "profile"
        }
    ];

    const currentPath = location.pathname;

    return (
        <div className="owner-app-container">
            {/* ==========================================
                MOBILE TOP BAR
            ========================================== */}
            <header className="owner-mobile-topbar">
                <button
                    className="owner-menu-toggle"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open sidebar"
                >
                    <Menu size={22} />
                </button>

                <div className="owner-mobile-brand">
                    <span className="owner-logo-icon">🏍️</span>
                    <span className="owner-logo-moto">Moto</span>
                    <span className="owner-logo-rent">Rent</span>
                    <span className="owner-panel-tag">Owner Panel</span>
                </div>

                <div className="owner-mobile-actions">
                    <NotificationBell />
                    <button
                        className="owner-avatar-btn"
                        onClick={() => navigate("/owner/profile")}
                        title={currentUser?.name || "Owner Profile"}
                    >
                        {currentUser?.name?.charAt(0)?.toUpperCase() || "O"}
                    </button>
                </div>
            </header>

            {/* SIDEBAR OVERLAY */}
            {sidebarOpen && (
                <div
                    className="owner-sidebar-backdrop"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* ==========================================
                DESKTOP & MOBILE SIDEBAR
            ========================================== */}
            <aside className={`owner-sidebar-panel ${sidebarOpen ? "open" : ""}`}>
                <div className="owner-sidebar-brand-header">
                    <Link to="/owner/dashboard" className="owner-brand-link">
                        <span className="owner-brand-symbol">🏍️</span>
                        <div>
                            <div className="owner-brand-title">
                                <span className="moto">Moto</span>
                                <span className="rent">Rent</span>
                            </div>
                            <span className="owner-panel-badge">OWNER PANEL</span>
                        </div>
                    </Link>

                    <button
                        className="owner-close-sidebar-btn"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* OWNER USER CARD */}
                <div
                    className="owner-profile-summary"
                    onClick={() => {
                        navigate("/owner/profile");
                        setSidebarOpen(false);
                    }}
                >
                    <div className="owner-profile-avatar">
                        {currentUser?.name?.charAt(0)?.toUpperCase() || "O"}
                    </div>
                    <div className="owner-profile-text">
                        <strong>{currentUser?.name || "Bike Owner"}</strong>
                        <span>{currentUser?.businessName || currentUser?.email || "Partner"}</span>
                    </div>
                    <ChevronRight size={16} className="owner-profile-arrow" />
                </div>

                {/* SIDEBAR NAVIGATION */}
                <nav className="owner-nav-list">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            currentPath === item.path ||
                            (item.path === "/owner/bikes/add" &&
                                (currentPath === "/owner/add-bike" ||
                                    currentPath.startsWith("/owner/bikes/edit"))) ||
                            activePage === item.key;

                        return (
                            <Link
                                key={item.key}
                                to={item.path}
                                className={`owner-nav-link ${isActive ? "active" : ""}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <div className="owner-nav-link-content">
                                    <Icon size={18} />
                                    <span>{item.label}</span>
                                </div>
                                {item.badge > 0 && (
                                    <span className="owner-nav-badge">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* SIDEBAR FOOTER */}
                <div className="owner-sidebar-footer">
                    <button
                        className="owner-sidebar-logout-btn"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* ==========================================
                MAIN CONTENT AREA
            ========================================== */}
            <div className="owner-main-wrapper">
                {/* DESKTOP TOP HEADER */}
                <header className="owner-desktop-topbar">
                    <div className="owner-topbar-left">
                        <span className="owner-topbar-context">MotoRent Bike Owner Portal</span>
                    </div>

                    <div className="owner-topbar-right">
                        <NotificationBell />

                        <div
                            className="owner-topbar-user"
                            onClick={() => navigate("/owner/profile")}
                            title="Go to Profile"
                        >
                            <div className="owner-topbar-avatar">
                                {currentUser?.name?.charAt(0)?.toUpperCase() || "O"}
                            </div>
                            <div className="owner-topbar-name">
                                <strong>{currentUser?.name}</strong>
                                <small>Bike Owner</small>
                            </div>
                        </div>

                        <button
                            className="owner-topbar-logout"
                            onClick={handleLogout}
                            title="Sign Out"
                        >
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                </header>

                {/* PAGE BODY */}
                <main className="owner-page-body">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default OwnerLayout;
