import { useState, useEffect, useMemo } from "react";
import {
    Bike,
    CheckCircle2,
    Clock,
    Search,
    X,
    Eye,
    Check,
    AlertOctagon,
    MapPin,
    Tag,
    IndianRupee,
    Store,
    Calendar,
    ShieldAlert,
    XCircle
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import BlockReasonModal from "../../components/admin/BlockReasonModal";
import ConfirmationModal from "../../components/admin/ConfirmationModal";
import adminService from "../../services/adminService";
import { getImageUrl } from "../../services/api";
import "./Clients.css";
import "./AdminBikes.css";

const AdminBikes = () => {
    const [bikes, setBikes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // "all" | "approved" | "blocked" | "pending" | "rejected"

    // View Details Modal
    const [selectedBike, setSelectedBike] = useState(null);

    // Block / Unblock Modals
    const [blockModal, setBlockModal] = useState({ isOpen: false, bike: null });
    const [unblockModal, setUnblockModal] = useState({ isOpen: false, bike: null });

    const [processingId, setProcessingId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 4000);
    };

    const loadBikes = async () => {
        try {
            const data = await adminService.getAdminBikes();
            setBikes(data.bikes || []);
        } catch (err) {
            console.error("Failed to load bikes:", err);
            showToast(err.response?.data?.message || "Failed to load bike listings", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBikes();
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

    // Dynamic counts
    const totalCount = bikes.length;
    const approvedCount = bikes.filter((b) => b.approvalStatus === "approved" && !b.isBlocked).length;
    const blockedCount = bikes.filter((b) => b.approvalStatus === "blocked" || b.status === "blocked" || b.isBlocked).length;
    const pendingCount = bikes.filter((b) => b.approvalStatus === "pending" && !b.isBlocked).length;
    const rejectedCount = bikes.filter((b) => b.approvalStatus === "rejected" && !b.isBlocked).length;

    // Filter and search
    const filteredBikes = useMemo(() => {
        return bikes.filter((bike) => {
            const isBlocked = bike.approvalStatus === "blocked" || bike.status === "blocked" || bike.isBlocked;

            if (statusFilter === "approved" && (bike.approvalStatus !== "approved" || isBlocked)) return false;
            if (statusFilter === "blocked" && !isBlocked) return false;
            if (statusFilter === "pending" && (bike.approvalStatus !== "pending" || isBlocked)) return false;
            if (statusFilter === "rejected" && (bike.approvalStatus !== "rejected" || isBlocked)) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = bike.bikeName?.toLowerCase().includes(q);
                const matchBrand = bike.brand?.toLowerCase().includes(q);
                const matchModel = bike.model?.toLowerCase().includes(q);
                const matchLocation = bike.location?.toLowerCase().includes(q);
                const matchOwner = bike.ownerId?.name?.toLowerCase().includes(q);
                const matchBusiness = bike.ownerId?.businessName?.toLowerCase().includes(q);

                if (!matchName && !matchBrand && !matchModel && !matchLocation && !matchOwner && !matchBusiness) {
                    return false;
                }
            }

            return true;
        });
    }, [bikes, statusFilter, searchQuery]);

    // Handle Block Submit
    const handleBlockSubmit = async (reason) => {
        if (!blockModal.bike) return;
        const target = blockModal.bike;
        try {
            setProcessingId(target._id);
            await adminService.blockBike(target._id, reason);
            showToast(`Bike "${target.bikeName}" blocked successfully.`);
            setBlockModal({ isOpen: false, bike: null });
            if (selectedBike?._id === target._id) {
                setSelectedBike(null);
            }
            await loadBikes();
        } catch (error) {
            showToast(error.response?.data?.message || error.message || "Failed to block bike", "error");
        } finally {
            setProcessingId(null);
        }
    };

    // Handle Unblock Submit
    const handleUnblockSubmit = async () => {
        if (!unblockModal.bike) return;
        const target = unblockModal.bike;
        try {
            setProcessingId(target._id);
            await adminService.unblockBike(target._id);
            showToast(`Bike "${target.bikeName}" unblocked successfully.`);
            setUnblockModal({ isOpen: false, bike: null });
            if (selectedBike?._id === target._id) {
                setSelectedBike(null);
            }
            await loadBikes();
        } catch (error) {
            showToast(error.response?.data?.message || error.message || "Failed to unblock bike", "error");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <AdminLayout title="Bike Management">
            <div className="admin-bikes-page">
                {/* PAGE HEADER */}
                <div className="bikes-page-header">
                    <div className="bikes-header-content">
                        <h2>Bike Management</h2>
                        <p>View and manage all bikes listed on MotoRent.</p>
                    </div>
                </div>

                {/* METRICS SUMMARY */}
                <div className="bikes-summary-grid">
                    <div
                        className={`bikes-summary-card ${statusFilter === "all" ? "active-tab" : ""}`}
                        onClick={() => setStatusFilter("all")}
                    >
                        <div className="bike-metric-icon total">
                            <Bike size={22} />
                        </div>
                        <div className="client-metric-info">
                            <span className="client-metric-label">Total Bikes</span>
                            <strong className="client-metric-val">{loading ? "..." : totalCount}</strong>
                            <span className="client-metric-sub">Full fleet catalog</span>
                        </div>
                    </div>

                    <div
                        className={`bikes-summary-card ${statusFilter === "approved" ? "active-tab" : ""}`}
                        onClick={() => setStatusFilter("approved")}
                    >
                        <div className="bike-metric-icon approved">
                            <CheckCircle2 size={22} />
                        </div>
                        <div className="client-metric-info">
                            <span className="client-metric-label">Approved</span>
                            <strong className="client-metric-val" style={{ color: "#16a34a" }}>
                                {loading ? "..." : approvedCount}
                            </strong>
                            <span className="client-metric-sub">Live on Marketplace</span>
                        </div>
                    </div>

                    <div
                        className={`bikes-summary-card ${statusFilter === "blocked" ? "active-tab" : ""}`}
                        onClick={() => setStatusFilter("blocked")}
                    >
                        <div className="bike-metric-icon blocked">
                            <AlertOctagon size={22} />
                        </div>
                        <div className="client-metric-info">
                            <span className="client-metric-label">Blocked</span>
                            <strong className="client-metric-val" style={{ color: "#dc2626" }}>
                                {loading ? "..." : blockedCount}
                            </strong>
                            <span className="client-metric-sub">Removed by admin</span>
                        </div>
                    </div>

                    <div
                        className={`bikes-summary-card ${statusFilter === "pending" ? "active-tab" : ""}`}
                        onClick={() => setStatusFilter("pending")}
                    >
                        <div className="bike-metric-icon pending">
                            <Clock size={22} />
                        </div>
                        <div className="client-metric-info">
                            <span className="client-metric-label">Pending</span>
                            <strong className="client-metric-val" style={{ color: "#ea580c" }}>
                                {loading ? "..." : pendingCount}
                            </strong>
                            <span className="client-metric-sub">Awaiting review</span>
                        </div>
                    </div>

                    <div
                        className={`bikes-summary-card ${statusFilter === "rejected" ? "active-tab" : ""}`}
                        onClick={() => setStatusFilter("rejected")}
                    >
                        <div className="bike-metric-icon rejected">
                            <XCircle size={22} />
                        </div>
                        <div className="client-metric-info">
                            <span className="client-metric-label">Rejected</span>
                            <strong className="client-metric-val" style={{ color: "#64748b" }}>
                                {loading ? "..." : rejectedCount}
                            </strong>
                            <span className="client-metric-sub">Listing declined</span>
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
                            <span className="clients-tab-badge">{totalCount}</span>
                        </button>
                        <button
                            className={`clients-tab-btn ${statusFilter === "approved" ? "active" : ""}`}
                            onClick={() => setStatusFilter("approved")}
                        >
                            <span>Approved</span>
                            <span className="clients-tab-badge">{approvedCount}</span>
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
                        <button
                            className={`clients-tab-btn ${statusFilter === "rejected" ? "active" : ""}`}
                            onClick={() => setStatusFilter("rejected")}
                        >
                            <span>Rejected</span>
                            <span className="clients-tab-badge">{rejectedCount}</span>
                        </button>
                    </div>

                    <div className="clients-search-box">
                        <Search className="clients-search-icon" size={16} />
                        <input
                            type="text"
                            className="clients-search-input"
                            placeholder="Search bikes by name, brand, location, owner..."
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
                        <p>Loading bike catalog...</p>
                    </div>
                ) : filteredBikes.length === 0 ? (
                    <div className="pending-empty-state">
                        <div className="empty-state-icon-wrapper search">
                            <Bike size={32} />
                        </div>
                        <h3>No Bikes Found</h3>
                        <p>
                            {searchQuery
                                ? `No bikes match your search query "${searchQuery}".`
                                : "No bikes match the selected status filter."}
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
                                        <th>Bike</th>
                                        <th>Brand & Model</th>
                                        <th>Type</th>
                                        <th>Owner</th>
                                        <th>Price / Day</th>
                                        <th>Location</th>
                                        <th>Bike Status</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBikes.map((bike) => {
                                        const imgUrl = getImageUrl(bike.image);
                                        const isBlocked =
                                            bike.approvalStatus === "blocked" ||
                                            bike.status === "blocked" ||
                                            bike.isBlocked;

                                        return (
                                            <tr key={bike._id}>
                                                <td>
                                                    <div className="bike-table-cell">
                                                        <div className="bike-table-thumb">
                                                            {imgUrl ? (
                                                                <img src={imgUrl} alt={bike.bikeName} />
                                                            ) : (
                                                                <span>🏍️</span>
                                                            )}
                                                        </div>
                                                        <span className="client-name-bold">{bike.bikeName}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ color: "#334155", fontWeight: 600 }}>
                                                        {bike.brand} {bike.model}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ color: "#64748b" }}>{bike.type || "Bike"}</span>
                                                </td>
                                                <td>
                                                    <div>
                                                        <span style={{ fontWeight: 600, color: "#0f172a", display: "block" }}>
                                                            {bike.ownerId?.name || "Verified Owner"}
                                                        </span>
                                                        {bike.ownerId?.businessName && (
                                                            <span style={{ fontSize: 11, color: "#64748b" }}>
                                                                {bike.ownerId.businessName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 800, color: "#2563eb" }}>
                                                        ₹{bike.pricePerDay} / Day
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ color: "#64748b", fontSize: 12 }}>
                                                        <MapPin size={11} style={{ verticalAlign: "middle", marginRight: 2 }} />
                                                        {bike.location}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`client-status-pill ${
                                                            isBlocked
                                                                ? "blocked"
                                                                : bike.approvalStatus === "approved"
                                                                ? "active"
                                                                : bike.approvalStatus === "rejected"
                                                                ? "suspended"
                                                                : "pending"
                                                        }`}
                                                    >
                                                        {isBlocked
                                                            ? "Blocked"
                                                            : bike.approvalStatus === "approved"
                                                            ? "Approved"
                                                            : bike.approvalStatus === "rejected"
                                                            ? "Rejected"
                                                            : "Pending"}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div className="client-actions-group">
                                                        <button
                                                            className="btn-client-view"
                                                            onClick={() => setSelectedBike(bike)}
                                                        >
                                                            <Eye size={13} /> View
                                                        </button>

                                                        {isBlocked ? (
                                                            <button
                                                                className="btn-client-unblock"
                                                                onClick={() => setUnblockModal({ isOpen: true, bike })}
                                                                disabled={processingId === bike._id}
                                                            >
                                                                <Check size={13} /> Unblock
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn-client-block"
                                                                onClick={() => setBlockModal({ isOpen: true, bike })}
                                                                disabled={processingId === bike._id}
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

                {/* BIKE DETAILS MODAL */}
                {selectedBike && (
                    <div className="details-modal-backdrop" onClick={() => setSelectedBike(null)}>
                        <div className="details-modal-card" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
                            <div className="details-modal-header">
                                <div className="modal-header-badge-group">
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                                        Bike Listing Details
                                    </h3>
                                    <span
                                        className={`client-status-pill ${
                                            selectedBike.approvalStatus === "blocked" ||
                                            selectedBike.status === "blocked" ||
                                            selectedBike.isBlocked
                                                ? "blocked"
                                                : selectedBike.approvalStatus === "approved"
                                                ? "active"
                                                : "pending"
                                        }`}
                                    >
                                        {selectedBike.approvalStatus === "blocked" ||
                                        selectedBike.status === "blocked" ||
                                        selectedBike.isBlocked
                                            ? "Blocked by Admin"
                                            : selectedBike.approvalStatus || "pending"}
                                    </span>
                                </div>
                                <button className="details-modal-close" onClick={() => setSelectedBike(null)}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="details-modal-body">
                                {(selectedBike.approvalStatus === "blocked" ||
                                    selectedBike.status === "blocked" ||
                                    selectedBike.isBlocked) && (
                                    <div className="modal-block-alert">
                                        <ShieldAlert size={20} style={{ flexShrink: 0 }} />
                                        <div>
                                            <strong>Bike is Blocked by Administrator</strong>
                                            <span>
                                                Reason: {selectedBike.blockReason || "Customer complaint / vehicle safety issue"}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* LARGE BIKE IMAGE */}
                                <div className="details-bike-hero-image">
                                    {getImageUrl(selectedBike.image) ? (
                                        <img
                                            src={getImageUrl(selectedBike.image)}
                                            alt={selectedBike.bikeName}
                                        />
                                    ) : (
                                        <span style={{ fontSize: 64 }}>🏍️</span>
                                    )}
                                </div>

                                <div className="details-info-grid">
                                    <div className="details-info-item">
                                        <span className="info-label">Bike Name</span>
                                        <span className="info-val">{selectedBike.bikeName}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Brand & Model</span>
                                        <span className="info-val">{selectedBike.brand} {selectedBike.model}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Bike Type</span>
                                        <span className="info-val">{selectedBike.type}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Price Per Day</span>
                                        <span className="info-val text-blue" style={{ fontWeight: 800 }}>
                                            ₹{selectedBike.pricePerDay} / Day
                                        </span>
                                    </div>
                                    <div className="details-info-item full-width">
                                        <span className="info-label">Location</span>
                                        <span className="info-val">{selectedBike.location}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Owner Name</span>
                                        <span className="info-val">
                                            {selectedBike.ownerId?.name || "Verified Owner"}
                                            {selectedBike.ownerId?.businessName ? ` (${selectedBike.ownerId.businessName})` : ""}
                                        </span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Owner Contact</span>
                                        <span className="info-val">
                                            {selectedBike.ownerId?.email || selectedBike.ownerId?.mobile || "N/A"}
                                        </span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Rental Availability</span>
                                        <span className="info-val" style={{ textTransform: "capitalize" }}>
                                            {selectedBike.status || "available"}
                                        </span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Approval Status</span>
                                        <span className="info-val" style={{ textTransform: "capitalize" }}>
                                            {selectedBike.approvalStatus || "pending"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="details-modal-actions">
                                <button className="btn-modal-close" onClick={() => setSelectedBike(null)}>
                                    Close
                                </button>
                                {selectedBike.approvalStatus === "blocked" ||
                                selectedBike.status === "blocked" ||
                                selectedBike.isBlocked ? (
                                    <button
                                        className="btn-modal-approve"
                                        onClick={() => {
                                            const bikeToUnblock = selectedBike;
                                            setSelectedBike(null);
                                            setUnblockModal({ isOpen: true, bike: bikeToUnblock });
                                        }}
                                    >
                                        <Check size={14} /> Unblock Bike
                                    </button>
                                ) : (
                                    <button
                                        className="btn-modal-reject"
                                        onClick={() => {
                                            const bikeToBlock = selectedBike;
                                            setSelectedBike(null);
                                            setBlockModal({ isOpen: true, bike: bikeToBlock });
                                        }}
                                    >
                                        <AlertOctagon size={14} /> Block Bike
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* BLOCK REASON MODAL */}
                <BlockReasonModal
                    isOpen={blockModal.isOpen}
                    targetType="bike"
                    targetName={blockModal.bike?.bikeName || ""}
                    onConfirm={handleBlockSubmit}
                    onCancel={() => setBlockModal({ isOpen: false, bike: null })}
                    loading={Boolean(processingId)}
                />

                {/* UNBLOCK CONFIRMATION MODAL */}
                <ConfirmationModal
                    isOpen={unblockModal.isOpen}
                    title="Unblock Bike Listing"
                    message={`Are you sure you want to unblock "${unblockModal.bike?.bikeName}"? The bike will become available and reappear on the marketplace.`}
                    type="approve"
                    confirmText="Yes, Unblock Bike"
                    onConfirm={handleUnblockSubmit}
                    onCancel={() => setUnblockModal({ isOpen: false, bike: null })}
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

export default AdminBikes;
