import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    Users,
    UserCheck,
    UserX,
    Store,
    Bike,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowRight,
    MapPin,
    AlertTriangle,
    Eye,
    Check,
    X,
    BarChart3
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import ConfirmationModal from "../../components/admin/ConfirmationModal";
import adminService from "../../services/adminService";
import { getImageUrl } from "../../services/api";
import "./AdminDashboard.css";

const AdminDashboard = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionModal, setActionModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "approve",
        onConfirm: null
    });
    const [processingId, setProcessingId] = useState(null);

    const loadDashboardData = async () => {
        try {
            const data = await adminService.getDashboardStats();
            setStats(data);
        } catch (err) {
            console.error("Failed to load admin stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handleQuickAction = (action, item, type) => {
        // type: "client" | "owner" | "bike"
        // action: "approve" | "reject"
        const isClient = type === "client";
        const isOwner = type === "owner";
        const isBike = type === "bike";

        let itemName = item.name || item.bikeName || "Record";
        let title = `${action === "approve" ? "Approve" : "Reject"} ${isBike ? "Bike Listing" : isOwner ? "Bike Owner" : "Client"}`;
        let message = `Are you sure you want to ${action} ${itemName}?`;

        setActionModal({
            isOpen: true,
            title,
            message,
            type: action === "approve" ? "approve" : "reject",
            confirmText: action === "approve" ? "Yes, Approve" : "Yes, Reject",
            onConfirm: async () => {
                try {
                    setProcessingId(item._id);
                    if (isClient) {
                        if (action === "approve") await adminService.approveClient(item._id);
                        else await adminService.rejectClient(item._id);
                    } else if (isOwner) {
                        if (action === "approve") await adminService.approveOwner(item._id);
                        else await adminService.rejectOwner(item._id);
                    } else if (isBike) {
                        if (action === "approve") await adminService.approveBike(item._id);
                        else await adminService.rejectBike(item._id);
                    }
                    setActionModal((prev) => ({ ...prev, isOpen: false }));
                    loadDashboardData();
                } catch (error) {
                    alert(error.response?.data?.message || error.message || "Action failed");
                } finally {
                    setProcessingId(null);
                }
            }
        });
    };

    const summary = stats?.summary || {
        clients: { total: 0, active: 0, pending: 0 },
        owners: { total: 0, active: 0, pending: 0 },
        bikes: { total: 0, approved: 0, pending: 0 },
        pendingTotal: 0
    };

    return (
        <AdminLayout title="System Overview & Analytics">
            {/* HERO QUICK SUMMARY BAR */}
            {summary.pendingTotal > 0 && (
                <div className="admin-pending-alert-banner">
                    <div className="alert-banner-left">
                        <AlertTriangle className="alert-banner-icon" size={22} />
                        <div>
                            <strong>{summary.pendingTotal} items require administrative review</strong>
                            <p>
                                {summary.clients.pending} pending client(s), {summary.owners.pending} pending owner(s), {summary.bikes.pending} pending bike(s).
                            </p>
                        </div>
                    </div>
                    <button
                        className="btn-review-approvals"
                        onClick={() => navigate("/admin/pending-approvals")}
                    >
                        Review Pending Approvals <ArrowRight size={16} />
                    </button>
                </div>
            )}

            {/* 9 METRIC SUMMARY CARDS */}
            <div className="admin-metrics-section">
                <div className="metrics-group-title">
                    <span>KEY PLATFORM METRICS</span>
                </div>

                <div className="admin-metrics-grid">
                    {/* CLIENTS GROUP */}
                    <div className="metric-card">
                        <div className="metric-icon-box bg-blue-light text-blue">
                            <Users size={22} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Total Clients</span>
                            <strong className="metric-value">{loading ? "..." : summary.clients.total}</strong>
                            <span className="metric-subtext">Registered riders</span>
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-icon-box bg-green-light text-green">
                            <UserCheck size={22} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Active Clients</span>
                            <strong className="metric-value text-green">{loading ? "..." : summary.clients.active}</strong>
                            <span className="metric-subtext">Approved accounts</span>
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-icon-box bg-orange-light text-orange">
                            <Clock size={22} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Pending Clients</span>
                            <strong className="metric-value text-orange">{loading ? "..." : summary.clients.pending}</strong>
                            <span className="metric-subtext">Waiting review</span>
                        </div>
                    </div>

                    {/* OWNERS GROUP */}
                    <div className="metric-card">
                        <div className="metric-icon-box bg-purple-light text-purple">
                            <Store size={22} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Total Bike Owners</span>
                            <strong className="metric-value">{loading ? "..." : summary.owners.total}</strong>
                            <span className="metric-subtext">Rental partners</span>
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-icon-box bg-green-light text-green">
                            <CheckCircle2 size={22} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Active Owners</span>
                            <strong className="metric-value text-green">{loading ? "..." : summary.owners.active}</strong>
                            <span className="metric-subtext">Can list bikes</span>
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-icon-box bg-orange-light text-orange">
                            <Clock size={22} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Pending Owners</span>
                            <strong className="metric-value text-orange">{loading ? "..." : summary.owners.pending}</strong>
                            <span className="metric-subtext">Waiting review</span>
                        </div>
                    </div>

                    {/* BIKES GROUP */}
                    <div className="metric-card">
                        <div className="metric-icon-box bg-slate-light text-slate">
                            <Bike size={22} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Total Bikes</span>
                            <strong className="metric-value">{loading ? "..." : summary.bikes.total}</strong>
                            <span className="metric-subtext">Total fleet catalog</span>
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-icon-box bg-green-light text-green">
                            <CheckCircle2 size={22} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Approved Bikes</span>
                            <strong className="metric-value text-green">{loading ? "..." : summary.bikes.approved}</strong>
                            <span className="metric-subtext">Visible on Marketplace</span>
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-icon-box bg-orange-light text-orange">
                            <Clock size={22} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Pending Bikes</span>
                            <strong className="metric-value text-orange">{loading ? "..." : summary.bikes.pending}</strong>
                            <span className="metric-subtext">Need catalog approval</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS ROW */}
            <div className="admin-quick-actions-bar">
                <div className="quick-action-item" onClick={() => navigate("/admin/pending-approvals")}>
                    <div className="action-circle bg-orange">
                        <Clock size={20} />
                    </div>
                    <div>
                        <strong>Pending Approvals Center</strong>
                        <span>Review {summary.pendingTotal} pending registrations & listings</span>
                    </div>
                    <ArrowRight size={18} className="action-arrow" />
                </div>

                <div className="quick-action-item" onClick={() => navigate("/admin/clients")}>
                    <div className="action-circle bg-blue">
                        <Users size={20} />
                    </div>
                    <div>
                        <strong>Manage Clients</strong>
                        <span>View, approve, or suspend client accounts</span>
                    </div>
                    <ArrowRight size={18} className="action-arrow" />
                </div>

                <div className="quick-action-item" onClick={() => navigate("/admin/owners")}>
                    <div className="action-circle bg-purple">
                        <Store size={20} />
                    </div>
                    <div>
                        <strong>Manage Bike Owners</strong>
                        <span>Verify rental partners & inspect fleets</span>
                    </div>
                    <ArrowRight size={18} className="action-arrow" />
                </div>

                <div className="quick-action-item" onClick={() => navigate("/admin/bikes")}>
                    <div className="action-circle bg-green">
                        <Bike size={20} />
                    </div>
                    <div>
                        <strong>Bike Listings System</strong>
                        <span>Moderate bikes, pricing & availability</span>
                    </div>
                    <ArrowRight size={18} className="action-arrow" />
                </div>

                <div className="quick-action-item" onClick={() => navigate("/admin/reports")}>
                    <div className="action-circle bg-purple" style={{ background: "#7c3aed", color: "#fff" }}>
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <strong>Reports & Analytics</strong>
                        <span>Export Excel & view executive intelligence</span>
                    </div>
                    <ArrowRight size={18} className="action-arrow" />
                </div>
            </div>

            {/* DASHBOARD DUAL COLUMN (RECENT REGISTRATIONS & RECENT BIKES) */}
            <div className="admin-dashboard-split">
                {/* RECENT REGISTRATIONS TABLE */}
                <div className="admin-content-card">
                    <div className="card-header-flex">
                        <div>
                            <h3>Recent Registrations</h3>
                            <p>Latest users joined MotoRent</p>
                        </div>
                        <Link to="/admin/pending-approvals" className="link-view-all">
                            View All Approvals →
                        </Link>
                    </div>


                    {loading ? (
                        <div className="card-loading-state">
                            <div className="card-spinner"></div>
                            <p>Loading registrations...</p>
                        </div>
                    ) : stats?.recentRegistrations?.length === 0 ? (
                        <div className="card-empty-state">
                            <Users size={32} className="text-muted" />
                            <p>No user registrations found</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>User Details</th>
                                        <th>Role</th>
                                        <th>Registered</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: "right" }}>Quick Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.recentRegistrations?.map((user) => (
                                        <tr key={user._id}>
                                            <td>
                                                <div className="user-table-cell">
                                                    <div className="user-avatar-tiny">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <strong>{user.name}</strong>
                                                        <span className="user-subemail">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`role-tag role-${user.role}`}>
                                                    {user.role === "customer" ? "Client" : "Bike Owner"}
                                                </span>
                                            </td>
                                            <td className="text-muted text-sm">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <span className={`status-badge-pill status-${user.status || "pending"}`}>
                                                    {user.status || "pending"}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                {user.status === "pending" ? (
                                                    <div className="action-btn-group justify-end">
                                                        <button
                                                            className="btn-action-icon approve"
                                                            title="Approve Account"
                                                            onClick={() => handleQuickAction("approve", user, user.role === "owner" ? "owner" : "client")}
                                                            disabled={processingId === user._id}
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            className="btn-action-icon reject"
                                                            title="Reject Account"
                                                            onClick={() => handleQuickAction("reject", user, user.role === "owner" ? "owner" : "client")}
                                                            disabled={processingId === user._id}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="btn-table-view"
                                                        onClick={() => navigate(user.role === "owner" ? "/admin/owners" : "/admin/clients")}
                                                    >
                                                        View
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* RECENTLY ADDED BIKES */}
                <div className="admin-content-card">
                    <div className="card-header-flex">
                        <div>
                            <h3>Recently Added Bikes</h3>
                            <p>Latest bikes added by owners</p>
                        </div>
                        <Link to="/admin/bikes" className="link-view-all">
                            View All Fleet →
                        </Link>
                    </div>

                    {loading ? (
                        <div className="card-loading-state">
                            <div className="card-spinner"></div>
                            <p>Loading fleet...</p>
                        </div>
                    ) : stats?.recentBikes?.length === 0 ? (
                        <div className="card-empty-state">
                            <Bike size={32} className="text-muted" />
                            <p>No bikes have been added yet</p>
                        </div>
                    ) : (
                        <div className="recent-bikes-list">
                            {stats?.recentBikes?.map((bike) => {
                                const img = getImageUrl(bike.image);
                                return (
                                    <div className="recent-bike-item" key={bike._id}>
                                        <div className="bike-thumb-box">
                                            {img ? (
                                                <img src={img} alt={bike.bikeName} />
                                            ) : (
                                                <span>🏍️</span>
                                            )}
                                        </div>
                                        <div className="bike-item-details">
                                            <strong>{bike.bikeName}</strong>
                                            <span className="bike-sub-spec">
                                                {bike.brand} {bike.model} • ₹{bike.pricePerDay}/day
                                            </span>
                                            <span className="bike-owner-meta">
                                                <MapPin size={12} /> {bike.location} • Owner: {bike.ownerId?.name || "Verified Owner"}
                                            </span>
                                        </div>
                                        <div className="bike-item-actions">
                                            <span className={`status-badge-pill status-${bike.approvalStatus || "pending"}`}>
                                                {bike.approvalStatus || "pending"}
                                            </span>
                                            {bike.approvalStatus === "pending" && (
                                                <div className="action-btn-group" style={{ marginTop: 6 }}>
                                                    <button
                                                        className="btn-action-icon approve"
                                                        title="Approve Listing"
                                                        onClick={() => handleQuickAction("approve", bike, "bike")}
                                                        disabled={processingId === bike._id}
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        className="btn-action-icon reject"
                                                        title="Reject Listing"
                                                        onClick={() => handleQuickAction("reject", bike, "bike")}
                                                        disabled={processingId === bike._id}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* CONFIRMATION MODAL */}
            <ConfirmationModal
                isOpen={actionModal.isOpen}
                title={actionModal.title}
                message={actionModal.message}
                type={actionModal.type}
                confirmText={actionModal.confirmText}
                onConfirm={actionModal.onConfirm}
                onCancel={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
                loading={Boolean(processingId)}
            />
        </AdminLayout>
    );
};

export default AdminDashboard;
