import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Store,
    Bike,
    Clock,
    CalendarCheck,
    CreditCard,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    ExternalLink,
    Bell,
    ShieldCheck
} from "lucide-react";
import useAuth from "../../context/useAuth";
import adminService from "../../services/adminService";
import "./AdminLayout.css";

const AdminLayout = ({ children, title = "Admin Portal" }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    const currentUser = user || (() => {
        try {
            const raw = localStorage.getItem("user") || localStorage.getItem("motorent_user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    useEffect(() => {
        let isMounted = true;
        adminService.getDashboardStats()
            .then((data) => {
                if (isMounted && data?.summary) {
                    setPendingCount(data.summary.pendingTotal || 0);
                }
            })
            .catch(() => {});

        return () => {
            isMounted = false;
        };
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate("/admin/login");
    };

    const navItems = [
        {
            to: "/admin/dashboard",
            label: "Dashboard",
            icon: <LayoutDashboard size={19} />
        },
        {
            to: "/admin/clients",
            label: "Clients",
            icon: <Users size={19} />
        },
        {
            to: "/admin/owners",
            label: "Bike Owners",
            icon: <Store size={19} />
        },
        {
            to: "/admin/bikes",
            label: "Bikes",
            icon: <Bike size={19} />
        },
        {
            to: "/admin/pending-approvals",
            label: "Pending Approvals",
            icon: <Clock size={19} />,
            badge: pendingCount > 0 ? pendingCount : null
        },
        {
            to: "/admin/bookings",
            label: "Bookings",
            icon: <CalendarCheck size={19} />
        },
        {
            to: "/admin/payments",
            label: "Payments",
            icon: <CreditCard size={19} />
        },
        {
            to: "/admin/reports",
            label: "Reports",
            icon: <BarChart3 size={19} />
        },
        {
            to: "/admin/settings",
            label: "Settings",
            icon: <Settings size={19} />
        }
    ];

    return (
        <div className="admin-app-layout">
            {/* MOBILE HEADER */}
            <header className="admin-mobile-header">
                <button
                    className="admin-menu-toggle"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open navigation menu"
                >
                    <Menu size={22} />
                </button>
                <div className="admin-mobile-brand">
                    <span className="brand-icon">🏍️</span>
                    <span className="brand-text">Moto<span className="text-orange">Rent</span> <span className="admin-tag">ADMIN</span></span>
                </div>
            </header>

            {/* SIDEBAR OVERLAY */}
            {sidebarOpen && (
                <div
                    className="admin-sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* SIDEBAR */}
            <aside className={`admin-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
                <div className="admin-sidebar-header">
                    <div className="admin-brand-logo">
                        <div className="brand-logo-icon">🏍️</div>
                        <div className="brand-logo-title">
                            <span className="moto">Moto</span>
                            <span className="rent">Rent</span>
                            <span className="admin-badge-pill">ADMIN</span>
                        </div>
                    </div>
                    <button
                        className="admin-sidebar-close"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ADMIN PROFILE CARD */}
                <div className="admin-profile-badge">
                    <div className="admin-avatar">
                        <ShieldCheck size={20} className="avatar-shield" />
                    </div>
                    <div className="admin-profile-info">
                        <strong>{currentUser?.name || "System Admin"}</strong>
                        <span>{currentUser?.email || "admin@motorent.com"}</span>
                    </div>
                </div>

                {/* NAVIGATION LINKS */}
                <nav className="admin-nav-menu">
                    <div className="nav-section-label">MAIN NAVIGATION</div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `admin-nav-link ${isActive ? "active" : ""}`
                            }
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                            {item.badge && (
                                <span className="nav-badge-alert">{item.badge}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* FOOTER ACTIONS */}
                <div className="admin-sidebar-footer">
                    <button
                        className="admin-quick-view-btn"
                        onClick={() => window.open("/", "_blank")}
                        title="Open customer catalog in new tab"
                    >
                        <ExternalLink size={16} />
                        <span>View Marketplace</span>
                    </button>

                    <button className="admin-logout-btn" onClick={handleLogout}>
                        <LogOut size={17} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="admin-main-wrapper">
                {/* DESKTOP TOP HEADER */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <span className="topbar-context-badge">MTORENT CONTROL PANEL</span>
                        <h1 className="topbar-title">{title}</h1>
                    </div>

                    <div className="topbar-right">
                        {pendingCount > 0 && (
                            <NavLink to="/admin/pending-approvals" className="topbar-alert-chip">
                                <Bell size={15} />
                                <span>{pendingCount} Pending Approvals</span>
                            </NavLink>
                        )}


                        <div className="topbar-admin-profile">
                            <div className="admin-topbar-avatar">
                                {currentUser?.name?.charAt(0)?.toUpperCase() || "A"}
                            </div>
                            <div className="admin-topbar-details">
                                <span className="admin-name">{currentUser?.name || "Admin"}</span>
                                <span className="admin-role">Super Admin</span>
                            </div>
                        </div>

                        <button
                            className="topbar-logout-icon"
                            onClick={handleLogout}
                            title="Sign Out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                {/* PAGE BODY */}
                <main className="admin-content-body">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
