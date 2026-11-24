import { useState, useEffect, useMemo } from "react";
import {
    Store,
    CheckCircle2,
    Clock,
    Search,
    X,
    Eye,
    Check,
    AlertOctagon,
    Phone,
    Mail,
    Calendar,
    Building2,
    MapPin,
    Bike,
    ShieldAlert,
    UserCheck,
    UserX
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import BlockReasonModal from "../../components/admin/BlockReasonModal";
import ConfirmationModal from "../../components/admin/ConfirmationModal";
import adminService from "../../services/adminService";
import { getImageUrl } from "../../services/api";
import "./Clients.css";
import "./Owners.css";

const Owners = () => {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "blocked" | "pending"

    // View Details Modal (full owner details with bikes)
    const [selectedOwner, setSelectedOwner] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Block / Unblock Modals
    const [blockModal, setBlockModal] = useState({ isOpen: false, owner: null });
    const [unblockModal, setUnblockModal] = useState({ isOpen: false, owner: null });

    const [processingId, setProcessingId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 4000);
    };

    const loadOwners = async () => {
        try {
            const data = await adminService.getOwners();
            setOwners(data.owners || []);
        } catch (err) {
            console.error("Failed to load owners:", err);
            showToast(err.response?.data?.message || "Failed to load bike owners", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOwners();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const d = new Date(dateString);
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    // Calculate dynamic counts
    const totalCount = owners.length;
    const activeCount = owners.filter((o) => o.status === "active").length;
    const blockedCount = owners.filter((o) => o.status === "blocked" || o.isBlocked).length;
    const pendingCount = owners.filter((o) => o.status === "pending").length;

    // Filter and search
    const filteredOwners = useMemo(() => {
        return owners.filter((owner) => {
            const isBlocked = owner.status === "blocked" || owner.isBlocked;
            if (statusFilter === "active" && owner.status !== "active") return false;
            if (statusFilter === "blocked" && !isBlocked) return false;
            if (statusFilter === "pending" && owner.status !== "pending") return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = owner.name?.toLowerCase().includes(q);
                const matchEmail = owner.email?.toLowerCase().includes(q);
                const matchMobile = owner.mobile?.toLowerCase().includes(q);
                const matchBusiness = owner.businessName?.toLowerCase().includes(q);
                if (!matchName && !matchEmail && !matchMobile && !matchBusiness) return false;
            }

            return true;
        });
    }, [owners, statusFilter, searchQuery]);

    // View Details handler (fetches single owner with full bike fleet)
    const handleViewDetails = async (owner) => {
        setSelectedOwner(owner);
        setLoadingDetails(true);
        try {
            const res = await adminService.getOwnerById(owner._id);
            if (res && res.owner) {
                setSelectedOwner(res.owner);
            }
        } catch (err) {
            console.error("Failed to load owner fleet details:", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Handle Block Submit
    const handleBlockSubmit = async (reason) => {
        if (!blockModal.owner) return;
        const target = blockModal.owner;
        try {
            setProcessingId(target._id);
            await adminService.blockOwner(target._id, reason);
            showToast(`Bike owner "${target.name}" blocked successfully.`);
            setBlockModal({ isOpen: false, owner: null });
            if (selectedOwner?._id === target._id) {
                setSelectedOwner(null);
            }
            await loadOwners();
        } catch (error) {
            showToast(error.response?.data?.message || error.message || "Failed to block owner", "error");
        } finally {
            setProcessingId(null);
        }
    };

    // Handle Unblock Submit
    const handleUnblockSubmit = async () => {
        if (!unblockModal.owner) return;
        const target = unblockModal.owner;
        try {
            setProcessingId(target._id);
            await adminService.unblockOwner(target._id);
            showToast(`Bike owner "${target.name}" unblocked successfully.`);
            setUnblockModal({ isOpen: false, owner: null });
            if (selectedOwner?._id === target._id) {
                setSelectedOwner(null);
            }
            await loadOwners();
        } catch (error) {
            showToast(error.response?.data?.message || error.message || "Failed to unblock owner", "error");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <AdminLayout title="Bike Owner Management">
            <div className="owners-page">
                {/* PAGE HEADER */}
                <div className="owners-page-header">
                    <div className="owners-header-content">
                        <h2>Bike Owner Management</h2>
                        <p>View and manage all registered bike rental owners.</p>
                    </div>
                </div>

                {/* METRICS SUMMARY */}
                <div className="clients-summary-grid">
                    <div
                        className={`clients-summary-card ${statusFilter === "all" ? "active-tab" : ""}`}
                        onClick={() => setStatusFilter("all")}
                    >
                        <div className="client-metric-icon total" style={{ background: "#faf5ff", color: "#9333ea" }}>
                            <Store size={22} />
                        </div>
                        <div className="client-metric-info">
                            <span className="client-metric-label">Total Owners</span>
                            <strong className="client-metric-val">{loading ? "..." : totalCount}</strong>
                            <span className="client-metric-sub">Registered rental partners</span>
                        </div>
                    </div>

                    <div
                        className={`clients-summary-card ${statusFilter === "active" ? "active-tab" : ""}`}
                        onClick={() => setStatusFilter("active")}
                    >
                        <div className="client-metric-icon active">
                            <UserCheck size={22} />
                        </div>
                        <div className="client-metric-info">
                            <span className="client-metric-label">Active Owners</span>
                            <strong className="client-metric-val" style={{ color: "#16a34a" }}>
                                {loading ? "..." : activeCount}
                            </strong>
                            <span className="client-metric-sub">Can list & manage bikes</span>
                        </div>
                    </div>

                    <div
                        className={`clients-summary-card ${statusFilter === "blocked" ? "active-tab" : ""}`}
                        onClick={() => setStatusFilter("blocked")}
                    >
                        <div className="client-metric-icon blocked">
                            <UserX size={22} />
                        </div>
                        <div className="client-metric-info">
                            <span className="client-metric-label">Blocked Owners</span>
                            <strong className="client-metric-val" style={{ color: "#dc2626" }}>
                                {loading ? "..." : blockedCount}
                            </strong>
                            <span className="client-metric-sub">Access restricted</span>
                        </div>
                    </div>

                    <div
                        className={`clients-summary-card ${statusFilter === "pending" ? "active-tab" : ""}`}
                        onClick={() => setStatusFilter("pending")}
                    >
                        <div className="client-metric-icon pending">
                            <Clock size={22} />
                        </div>
                        <div className="client-metric-info">
                            <span className="client-metric-label">Pending Owners</span>
                            <strong className="client-metric-val" style={{ color: "#ea580c" }}>
                                {loading ? "..." : pendingCount}
                            </strong>
                            <span className="client-metric-sub">Awaiting verification</span>
                        </div>
                    </div>
                </div>

                {/* CONTROLS: TABS & SEARCH */}
                <div className="clients-controls-bar">
                    <div className="clients-filter-tabs">
                        <button
                            className={`clients-tab-btn ${statusFilter === "all" ? "active" : ""}`}
                            onClick={() => setStatusFilter("all")}
                        >
                            <span>All</span>
                            <span className="clients-tab-badge" style={{ background: "#7e22ce" }}>{totalCount}</span>
                        </button>
                        <button
                            className={`clients-tab-btn ${statusFilter === "active" ? "active" : ""}`}
                            onClick={() => setStatusFilter("active")}
                        >
                            <span>Active</span>
                            <span className="clients-tab-badge">{activeCount}</span>
                        </button>
                        <button
                            className={`clients-tab-btn ${statusFilter === "blocked" ? "active" : ""}`}
                            onClick={() => setStatusFilter("blocked")}
                        >
                            <span>Blocked</span>
                            <span className="clients-tab-badge">{blockedCount}</span>
                        </button>
                        <button
                            className={`clients-tab-btn ${statusFilter === "pending" ? "active" : ""}`}
                            onClick={() => setStatusFilter("pending")}
                        >
                            <span>Pending</span>
                            <span className="clients-tab-badge">{pendingCount}</span>
                        </button>
                    </div>

                    <div className="clients-search-box">
                        <Search className="clients-search-icon" size={16} />
                        <input
                            type="text"
                            className="clients-search-input"
                            placeholder="Search owners by name, email, business..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="clients-search-clear"
                                onClick={() => setSearchQuery("")}
                                title="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* DATA TABLE */}
                {loading ? (
                    <div className="pending-loading-state">
                        <div className="pending-spinner"></div>
                        <p>Loading bike owners...</p>
                    </div>
                ) : filteredOwners.length === 0 ? (
                    <div className="pending-empty-state">
                        <div className="empty-state-icon-wrapper search">
                            <Store size={32} />
                        </div>
                        <h3>No Bike Owners Found</h3>
                        <p>
                            {searchQuery
                                ? `No bike owners match your search query "${searchQuery}".`
                                : "No bike owner accounts match the selected status filter."}
                        </p>
                        {searchQuery && (
                            <button
                                className="btn-client-view"
                                style={{ padding: "8px 16px" }}
                                onClick={() => setSearchQuery("")}
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="clients-table-card">
                        <div className="table-responsive">
                            <table className="clients-table">
                                <thead>
                                    <tr>
                                        <th>Bike Owner</th>
                                        <th>Email Address</th>
                                        <th>Phone</th>
                                        <th>Registered Date</th>
                                        <th>Number of Bikes</th>
                                        <th>Account Status</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOwners.map((owner) => {
                                        const isBlocked = owner.status === "blocked" || owner.isBlocked;
                                        return (
                                            <tr key={owner._id}>
                                                <td>
                                                    <div className="client-profile-cell">
                                                        <div
                                                            className="client-avatar-circle"
                                                            style={{ background: "#7e22ce" }}
                                                        >
                                                            {owner.name?.charAt(0)?.toUpperCase() || "O"}
                                                        </div>
                                                        <div>
                                                            <span className="client-name-bold">{owner.name}</span>
                                                            <span className="client-email-sub">
                                                                {owner.businessName || "Individual Owner"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ color: "#334155" }}>{owner.email}</span>
                                                </td>
                                                <td>
                                                    <span style={{ color: "#64748b" }}>{owner.mobile || "N/A"}</span>
                                                </td>
                                                <td>
                                                    <span style={{ color: "#64748b", fontSize: 12 }}>
                                                        {formatDate(owner.createdAt)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 700, color: "#2563eb" }}>
                                                        {owner.bikeCount || 0} Bikes
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`client-status-pill ${
                                                            isBlocked ? "blocked" : owner.status || "pending"
                                                        }`}
                                                    >
                                                        {isBlocked ? "Blocked" : owner.status || "pending"}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div className="client-actions-group">
                                                        <button
                                                            className="btn-client-view"
                                                            onClick={() => handleViewDetails(owner)}
                                                        >
                                                            <Eye size={13} /> View
                                                        </button>

                                                        {isBlocked ? (
                                                            <button
                                                                className="btn-client-unblock"
                                                                onClick={() => setUnblockModal({ isOpen: true, owner })}
                                                                disabled={processingId === owner._id}
                                                            >
                                                                <Check size={13} /> Unblock
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn-client-block"
                                                                onClick={() => setBlockModal({ isOpen: true, owner })}
                                                                disabled={processingId === owner._id}
                                                            >
                                                                <AlertOctagon size={13} /> Block
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* OWNER DETAILS MODAL */}
                {selectedOwner && (
                    <div className="details-modal-backdrop" onClick={() => setSelectedOwner(null)}>
                        <div className="details-modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
                            <div className="details-modal-header">
                                <div className="modal-header-badge-group">
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                                        Bike Owner Details
                                    </h3>
                                    <span
                                        className={`client-status-pill ${
                                            selectedOwner.status === "blocked" || selectedOwner.isBlocked
                                                ? "blocked"
                                                : selectedOwner.status || "pending"
                                        }`}
                                    >
                                        {selectedOwner.status === "blocked" || selectedOwner.isBlocked
                                            ? "Blocked"
                                            : selectedOwner.status || "pending"}
                                    </span>
                                </div>
                                <button className="details-modal-close" onClick={() => setSelectedOwner(null)}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="details-modal-body">
                                {(selectedOwner.status === "blocked" || selectedOwner.isBlocked) && (
                                    <div className="modal-block-alert">
                                        <ShieldAlert size={20} style={{ flexShrink: 0 }} />
                                        <div>
                                            <strong>Owner Account Blocked by Administrator</strong>
                                            <span>
                                                Reason: {selectedOwner.blockReason || "Administrative complaint / policy violation"}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="details-info-grid">
                                    <div className="details-info-item">
                                        <span className="info-label">Full Name</span>
                                        <span className="info-val">{selectedOwner.name}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Business Name</span>
                                        <span className="info-val">{selectedOwner.businessName || "N/A"}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Email Address</span>
                                        <span className="info-val">{selectedOwner.email}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Phone / Mobile</span>
                                        <span className="info-val">{selectedOwner.mobile || "N/A"}</span>
                                    </div>
                                    <div className="details-info-item full-width">
                                        <span className="info-label">Business Address</span>
                                        <span className="info-val">{selectedOwner.address || "N/A"}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Registration Date</span>
                                        <span className="info-val">{formatDate(selectedOwner.createdAt)}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Number of Bikes</span>
                                        <span className="info-val" style={{ color: "#2563eb", fontWeight: 700 }}>
                                            {selectedOwner.bikeCount || selectedOwner.bikes?.length || 0} Bikes Listed
                                        </span>
                                    </div>
                                </div>

                                {/* BIKE FLEET LIST */}
                                <div className="owner-fleet-section">
                                    <h4 className="owner-fleet-title">
                                        <Bike size={16} /> Owner's Bike Fleet ({selectedOwner.bikes?.length || 0})
                                    </h4>

                                    {loadingDetails ? (
                                        <p style={{ color: "#64748b", fontSize: 13 }}>Loading bike fleet...</p>
                                    ) : !selectedOwner.bikes || selectedOwner.bikes.length === 0 ? (
                                        <p style={{ color: "#94a3b8", fontSize: 13 }}>No bikes listed by this owner yet.</p>
                                    ) : (
                                        <div className="owner-fleet-list">
                                            {selectedOwner.bikes.map((bike) => {
                                                const img = getImageUrl(bike.image);
                                                return (
                                                    <div className="owner-fleet-item" key={bike._id}>
                                                        <div className="fleet-bike-thumb">
                                                            {img ? <img src={img} alt={bike.bikeName} /> : <span>🏍️</span>}
                                                        </div>
                                                        <div className="fleet-bike-details">
                                                            <strong className="fleet-bike-name">{bike.bikeName}</strong>
                                                            <div className="fleet-bike-meta">
                                                                <span>{bike.brand} {bike.model}</span>
                                                                <span>•</span>
                                                                <span className="fleet-price-pill">₹{bike.pricePerDay} / Day</span>
                                                                <span>•</span>
                                                                <span><MapPin size={10} /> {bike.location}</span>
                                                            </div>
                                                        </div>
                                                        <div className="fleet-bike-status">
                                                            <span
                                                                className={`client-status-pill ${
                                                                    bike.approvalStatus === "approved"
                                                                        ? "active"
                                                                        : bike.approvalStatus === "blocked"
                                                                        ? "blocked"
                                                                        : "pending"
                                                                }`}
                                                            >
                                                                {bike.approvalStatus}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="details-modal-actions">
                                <button className="btn-modal-close" onClick={() => setSelectedOwner(null)}>
                                    Close
                                </button>
                                {selectedOwner.status === "blocked" || selectedOwner.isBlocked ? (
                                    <button
                                        className="btn-modal-approve"
                                        onClick={() => {
                                            const ownerToUnblock = selectedOwner;
                                            setSelectedOwner(null);
                                            setUnblockModal({ isOpen: true, owner: ownerToUnblock });
                                        }}
                                    >
                                        <Check size={14} /> Unblock Owner
                                    </button>
                                ) : (
                                    <button
                                        className="btn-modal-reject"
                                        onClick={() => {
                                            const ownerToBlock = selectedOwner;
                                            setSelectedOwner(null);
                                            setBlockModal({ isOpen: true, owner: ownerToBlock });
                                        }}
                                    >
                                        <AlertOctagon size={14} /> Block Owner
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* BLOCK REASON MODAL */}
                <BlockReasonModal
                    isOpen={blockModal.isOpen}
                    targetType="owner"
                    targetName={blockModal.owner?.name || ""}
                    onConfirm={handleBlockSubmit}
                    onCancel={() => setBlockModal({ isOpen: false, owner: null })}
                    loading={Boolean(processingId)}
                />

                {/* UNBLOCK CONFIRMATION MODAL */}
                <ConfirmationModal
                    isOpen={unblockModal.isOpen}
                    title="Unblock Bike Owner Account"
                    message={`Are you sure you want to unblock "${unblockModal.owner?.name}"? They will regain access to their owner portal and fleet management.`}
                    type="approve"
                    confirmText="Yes, Unblock Owner"
                    onConfirm={handleUnblockSubmit}
                    onCancel={() => setUnblockModal({ isOpen: false, owner: null })}
                    loading={Boolean(processingId)}
                />

                {/* TOAST NOTIFICATION */}
                {toast.show && (
                    <div className={`pending-toast-notification ${toast.type}`}>
                        {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertOctagon size={18} />}
                        <span>{toast.message}</span>
                        <button className="toast-close-btn" onClick={() => setToast((prev) => ({ ...prev, show: false }))}>
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Owners;
