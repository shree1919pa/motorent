import { useState, useEffect, useMemo } from "react";
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    Search,
    X,
    Eye,
    Check,
    AlertOctagon,
    Phone,
    Mail,
    Calendar,
    ShieldAlert,
    CheckCircle2,
    CreditCard,
    FileText,
    ShieldCheck
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import BlockReasonModal from "../../components/admin/BlockReasonModal";
import ConfirmationModal from "../../components/admin/ConfirmationModal";
import adminService from "../../services/adminService";
import { getImageUrl } from "../../services/api";
import "./Clients.css";

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "blocked" | "pending"

    // View Details Modal
    const [selectedClient, setSelectedClient] = useState(null);

    // Licence Viewer Modal
    const [licenceModal, setLicenceModal] = useState({
        isOpen: false,
        client: null
    });

    // Block Reason Modal
    const [blockModal, setBlockModal] = useState({
        isOpen: false,
        client: null
    });

    // Unblock Confirmation Modal
    const [unblockModal, setUnblockModal] = useState({
        isOpen: false,
        client: null
    });

    const [processingId, setProcessingId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 4000);
    };

    const loadClients = async () => {
        try {
            const data = await adminService.getClients();
            setClients(data.clients || []);
        } catch (err) {
            console.error("Failed to load clients:", err);
            showToast(err.response?.data?.message || "Failed to load clients", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClients();
    }, []);

    // Date formatter
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
    const totalCount = clients.length;
    const activeCount = clients.filter((c) => c.status === "active").length;
    const blockedCount = clients.filter((c) => c.status === "blocked" || c.isBlocked).length;
    const pendingCount = clients.filter((c) => c.status === "pending").length;

    // Filter and search clients
    const filteredClients = useMemo(() => {
        return clients.filter((client) => {
            // Status filter
            const isBlocked = client.status === "blocked" || client.isBlocked;
            if (statusFilter === "active" && client.status !== "active") return false;
            if (statusFilter === "blocked" && !isBlocked) return false;
            if (statusFilter === "pending" && client.status !== "pending") return false;

            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = client.name?.toLowerCase().includes(q);
                const matchEmail = client.email?.toLowerCase().includes(q);
                const matchMobile = client.mobile?.toLowerCase().includes(q);
                const matchDL = client.drivingLicenseNumber?.toLowerCase().includes(q);
                if (!matchName && !matchEmail && !matchMobile && !matchDL) return false;
            }

            return true;
        });
    }, [clients, statusFilter, searchQuery]);

    // Handle Direct Approve
    const handleApproveClient = async (client) => {
        try {
            setProcessingId(client._id);
            await adminService.approveClient(client._id);
            showToast(`Client "${client.name}" approved successfully!`);
            if (selectedClient?._id === client._id) {
                setSelectedClient(null);
            }
            if (licenceModal.client?._id === client._id) {
                setLicenceModal({ isOpen: false, client: null });
            }
            await loadClients();
        } catch (error) {
            showToast(error.response?.data?.message || error.message || "Failed to approve client", "error");
        } finally {
            setProcessingId(null);
        }
    };

    // Handle Direct Reject
    const handleRejectClient = async (client) => {
        const confirmed = window.confirm(`Are you sure you want to reject client registration for "${client.name}"?`);
        if (!confirmed) return;

        try {
            setProcessingId(client._id);
            await adminService.rejectClient(client._id);
            showToast(`Client registration "${client.name}" rejected.`);
            if (selectedClient?._id === client._id) {
                setSelectedClient(null);
            }
            if (licenceModal.client?._id === client._id) {
                setLicenceModal({ isOpen: false, client: null });
            }
            await loadClients();
        } catch (error) {
            showToast(error.response?.data?.message || error.message || "Failed to reject client", "error");
        } finally {
            setProcessingId(null);
        }
    };

    // Handle Block Submit
    const handleBlockSubmit = async (reason) => {
        if (!blockModal.client) return;
        const target = blockModal.client;
        try {
            setProcessingId(target._id);
            await adminService.blockClient(target._id, reason);
            showToast(`Client "${target.name}" blocked successfully.`);
            setBlockModal({ isOpen: false, client: null });
            if (selectedClient?._id === target._id) {
                setSelectedClient(null);
            }
            if (licenceModal.client?._id === target._id) {
                setLicenceModal({ isOpen: false, client: null });
            }
            await loadClients();
        } catch (error) {
            showToast(error.response?.data?.message || error.message || "Failed to block client", "error");
        } finally {
            setProcessingId(null);
        }
    };

    // Handle Unblock Submit
    const handleUnblockSubmit = async () => {
        if (!unblockModal.client) return;
        const target = unblockModal.client;
        try {
            setProcessingId(target._id);
            await adminService.unblockClient(target._id);
            showToast(`Client "${target.name}" unblocked successfully.`);
            setUnblockModal({ isOpen: false, client: null });
            if (selectedClient?._id === target._id) {
                setSelectedClient(null);
            }
            if (licenceModal.client?._id === target._id) {
                setLicenceModal({ isOpen: false, client: null });
            }
            await loadClients();
        } catch (error) {
            showToast(error.response?.data?.message || error.message || "Failed to unblock client", "error");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <AdminLayout title="Client Management">
            <div className="clients-page">
                {/* PAGE HEADER */}
                <div className="clients-page-header">
                    <div className="clients-header-content">
                        <h2>Client Management</h2>
                        <p>View, verify driving licences, and manage all registered clients.</p>
                    </div>
                </div>

                {/* METRICS SUMMARY */}
                <div className="clients-summary-grid">
                    <div
                        className={`clients-summary-card ${statusFilter === "all" ? "active-tab" : ""}`}
                        onClick={() => setStatusFilter("all")}
                    >
                        <div className="client-metric-icon total">
                            <Users size={22} />
                        </div>
                        <div className="client-metric-info">
                            <span className="client-metric-label">Total Clients</span>
                            <strong className="client-metric-val">{loading ? "..." : totalCount}</strong>
                            <span className="client-metric-sub">All registered clients</span>
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
                            <span className="client-metric-label">Active Clients</span>
                            <strong className="client-metric-val" style={{ color: "#16a34a" }}>
                                {loading ? "..." : activeCount}
                            </strong>
                            <span className="client-metric-sub">Can login & rent bikes</span>
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
                            <span className="client-metric-label">Blocked Clients</span>
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
                            <span className="client-metric-label">Pending Clients</span>
                            <strong className="client-metric-val" style={{ color: "#ea580c" }}>
                                {loading ? "..." : pendingCount}
                            </strong>
                            <span className="client-metric-sub">Awaiting licence review</span>
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
                            placeholder="Search clients by name, email, phone, licence..."
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
                        <p>Loading registered clients...</p>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="pending-empty-state">
                        <div className="empty-state-icon-wrapper search">
                            <Users size={32} />
                        </div>
                        <h3>No Clients Found</h3>
                        <p>
                            {searchQuery
                                ? `No clients match your search query "${searchQuery}".`
                                : "No client accounts match the selected status filter."}
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
                                        <th>Client</th>
                                        <th>Email Address</th>
                                        <th>Phone</th>
                                        <th>Driving Licence</th>
                                        <th>Registered Date</th>
                                        <th>Account Status</th>
                                        <th>Total Bookings</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClients.map((client) => {
                                        const isBlocked = client.status === "blocked" || client.isBlocked;
                                        const isPending = client.status === "pending";
                                        const hasLicenceImage = Boolean(client.drivingLicenseImage);

                                        return (
                                            <tr key={client._id}>
                                                <td>
                                                    <div className="client-profile-cell">
                                                        <div className="client-avatar-circle">
                                                            {client.name?.charAt(0)?.toUpperCase() || "C"}
                                                        </div>
                                                        <div>
                                                            <span className="client-name-bold">{client.name}</span>
                                                            <span className="client-email-sub">{client.mobile || "Client"}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ color: "#334155" }}>{client.email}</span>
                                                </td>
                                                <td>
                                                    <span style={{ color: "#64748b" }}>{client.mobile || "N/A"}</span>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                        <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>
                                                            {client.drivingLicenseNumber || "Not Provided"}
                                                        </span>
                                                        {hasLicenceImage ? (
                                                            <button
                                                                className="btn-view-licence-badge"
                                                                onClick={() => setLicenceModal({ isOpen: true, client })}
                                                            >
                                                                <CreditCard size={12} /> View Licence
                                                            </button>
                                                        ) : (
                                                            <span style={{ fontSize: 11, color: "#94a3b8" }}>No image</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ color: "#64748b", fontSize: 12 }}>
                                                        {formatDate(client.createdAt)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`client-status-pill ${
                                                            isBlocked ? "blocked" : client.status || "pending"
                                                        }`}
                                                    >
                                                        {isBlocked ? "Blocked" : client.status || "pending"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 600, color: "#475569" }}>
                                                        {client.bookingCount !== undefined ? `${client.bookingCount} Bookings` : "0 Bookings"}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div className="client-actions-group">
                                                        <button
                                                            className="btn-client-view"
                                                            onClick={() => setSelectedClient(client)}
                                                            title="View full client details"
                                                        >
                                                            <Eye size={13} /> View
                                                        </button>

                                                        {isPending && (
                                                            <>
                                                                <button
                                                                    className="btn-client-approve"
                                                                    onClick={() => handleApproveClient(client)}
                                                                    disabled={processingId === client._id}
                                                                >
                                                                    <Check size={13} /> Approve
                                                                </button>
                                                                <button
                                                                    className="btn-client-reject"
                                                                    onClick={() => handleRejectClient(client)}
                                                                    disabled={processingId === client._id}
                                                                >
                                                                    <X size={13} /> Reject
                                                                </button>
                                                            </>
                                                        )}

                                                        {!isPending && !isBlocked && (
                                                            <button
                                                                className="btn-client-block"
                                                                onClick={() => setBlockModal({ isOpen: true, client })}
                                                                disabled={processingId === client._id}
                                                            >
                                                                <AlertOctagon size={13} /> Block
                                                            </button>
                                                        )}

                                                        {isBlocked && (
                                                            <button
                                                                className="btn-client-unblock"
                                                                onClick={() => setUnblockModal({ isOpen: true, client })}
                                                                disabled={processingId === client._id}
                                                            >
                                                                <Check size={13} /> Unblock
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

                {/* ===================================================
                    DRIVING LICENCE VIEWER MODAL
                =================================================== */}
                {licenceModal.isOpen && licenceModal.client && (
                    <div className="licence-modal-backdrop" onClick={() => setLicenceModal({ isOpen: false, client: null })}>
                        <div className="licence-modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="licence-modal-header">
                                <h3>
                                    <CreditCard size={20} color="#2563eb" /> Driving Licence Verification
                                </h3>
                                <button
                                    className="licence-modal-close"
                                    onClick={() => setLicenceModal({ isOpen: false, client: null })}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="licence-modal-body">
                                <div className="licence-image-viewport">
                                    {licenceModal.client.drivingLicenseImage ? (
                                        <img
                                            src={getImageUrl(licenceModal.client.drivingLicenseImage)}
                                            alt={`Licence of ${licenceModal.client.name}`}
                                        />
                                    ) : (
                                        <div className="licence-placeholder-empty">
                                            <FileText size={48} />
                                            <span>No licence image uploaded for this client.</span>
                                        </div>
                                    )}
                                </div>

                                <div className="licence-info-meta-panel">
                                    <div className="licence-meta-item">
                                        <span className="licence-meta-label">Client Name</span>
                                        <span className="licence-meta-value">{licenceModal.client.name}</span>
                                    </div>
                                    <div className="licence-meta-item">
                                        <span className="licence-meta-label">Licence Number</span>
                                        <span className="licence-meta-value" style={{ color: "#2563eb" }}>
                                            {licenceModal.client.drivingLicenseNumber || "Not Specified"}
                                        </span>
                                    </div>
                                    <div className="licence-meta-item">
                                        <span className="licence-meta-label">Email Address</span>
                                        <span className="licence-meta-value">{licenceModal.client.email}</span>
                                    </div>
                                    <div className="licence-meta-item">
                                        <span className="licence-meta-label">Account Status</span>
                                        <span
                                            className="licence-meta-value"
                                            style={{
                                                color:
                                                    licenceModal.client.status === "active"
                                                        ? "#16a34a"
                                                        : licenceModal.client.status === "blocked" || licenceModal.client.isBlocked
                                                        ? "#dc2626"
                                                        : "#ea580c",
                                                textTransform: "capitalize"
                                            }}
                                        >
                                            {licenceModal.client.status === "blocked" || licenceModal.client.isBlocked
                                                ? "Blocked"
                                                : licenceModal.client.status || "Pending"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="licence-modal-actions">
                                <button
                                    className="btn-modal-close"
                                    onClick={() => setLicenceModal({ isOpen: false, client: null })}
                                >
                                    Close
                                </button>

                                {licenceModal.client.status === "pending" && (
                                    <>
                                        <button
                                            className="btn-client-reject"
                                            style={{ padding: "8px 16px", fontSize: 13 }}
                                            onClick={() => handleRejectClient(licenceModal.client)}
                                            disabled={processingId === licenceModal.client._id}
                                        >
                                            <X size={14} /> Reject Client
                                        </button>
                                        <button
                                            className="btn-client-approve"
                                            style={{ padding: "8px 16px", fontSize: 13 }}
                                            onClick={() => handleApproveClient(licenceModal.client)}
                                            disabled={processingId === licenceModal.client._id}
                                        >
                                            <Check size={14} /> Approve Client
                                        </button>
                                    </>
                                )}

                                {licenceModal.client.status === "active" && !licenceModal.client.isBlocked && (
                                    <button
                                        className="btn-modal-reject"
                                        onClick={() => {
                                            const target = licenceModal.client;
                                            setLicenceModal({ isOpen: false, client: null });
                                            setBlockModal({ isOpen: true, client: target });
                                        }}
                                    >
                                        <AlertOctagon size={14} /> Block Client
                                    </button>
                                )}

                                {(licenceModal.client.status === "blocked" || licenceModal.client.isBlocked) && (
                                    <button
                                        className="btn-modal-approve"
                                        onClick={() => {
                                            const target = licenceModal.client;
                                            setLicenceModal({ isOpen: false, client: null });
                                            setUnblockModal({ isOpen: true, client: target });
                                        }}
                                    >
                                        <Check size={14} /> Unblock Client
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW DETAILS MODAL */}
                {selectedClient && (
                    <div className="details-modal-backdrop" onClick={() => setSelectedClient(null)}>
                        <div className="details-modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="details-modal-header">
                                <div className="modal-header-badge-group">
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                                        Client Details
                                    </h3>
                                    <span
                                        className={`client-status-pill ${
                                            selectedClient.status === "blocked" || selectedClient.isBlocked
                                                ? "blocked"
                                                : selectedClient.status || "pending"
                                        }`}
                                    >
                                        {selectedClient.status === "blocked" || selectedClient.isBlocked
                                            ? "Blocked"
                                            : selectedClient.status || "pending"}
                                    </span>
                                </div>
                                <button className="details-modal-close" onClick={() => setSelectedClient(null)}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="details-modal-body">
                                {(selectedClient.status === "blocked" || selectedClient.isBlocked) && (
                                    <div className="modal-block-alert">
                                        <ShieldAlert size={20} style={{ flexShrink: 0 }} />
                                        <div>
                                            <strong>Account is Blocked by Administrator</strong>
                                            <span>
                                                Reason: {selectedClient.blockReason || "Administrative complaint / action"}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="details-info-grid">
                                    <div className="details-info-item">
                                        <span className="info-label">Full Name</span>
                                        <span className="info-val">{selectedClient.name}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Email Address</span>
                                        <span className="info-val">{selectedClient.email}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Phone / Mobile</span>
                                        <span className="info-val">{selectedClient.mobile || "N/A"}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Driving Licence Number</span>
                                        <span className="info-val" style={{ color: "#2563eb", fontWeight: 700 }}>
                                            {selectedClient.drivingLicenseNumber || "Not Provided"}
                                        </span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Registration Date</span>
                                        <span className="info-val">{formatDate(selectedClient.createdAt)}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <span className="info-label">Account Status</span>
                                        <span
                                            className="info-val"
                                            style={{
                                                color:
                                                    selectedClient.status === "active"
                                                        ? "#16a34a"
                                                        : selectedClient.status === "blocked" || selectedClient.isBlocked
                                                        ? "#dc2626"
                                                        : "#ea580c",
                                                textTransform: "capitalize",
                                                fontWeight: 700
                                            }}
                                        >
                                            {selectedClient.status === "blocked" || selectedClient.isBlocked
                                                ? "Blocked"
                                                : selectedClient.status || "pending"}
                                        </span>
                                    </div>
                                </div>

                                {selectedClient.drivingLicenseImage && (
                                    <div style={{ marginTop: 8 }}>
                                        <button
                                            type="button"
                                            className="btn-view-licence-badge"
                                            style={{ padding: "8px 16px", fontSize: 13 }}
                                            onClick={() => {
                                                const cl = selectedClient;
                                                setSelectedClient(null);
                                                setLicenceModal({ isOpen: true, client: cl });
                                            }}
                                        >
                                            <CreditCard size={14} /> Open Full Licence Viewer
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="details-modal-actions">
                                <button className="btn-modal-close" onClick={() => setSelectedClient(null)}>
                                    Close
                                </button>
                                {selectedClient.status === "pending" && (
                                    <>
                                        <button
                                            className="btn-modal-reject"
                                            onClick={() => handleRejectClient(selectedClient)}
                                            disabled={processingId === selectedClient._id}
                                        >
                                            <X size={14} /> Reject Client
                                        </button>
                                        <button
                                            className="btn-modal-approve"
                                            onClick={() => handleApproveClient(selectedClient)}
                                            disabled={processingId === selectedClient._id}
                                        >
                                            <Check size={14} /> Approve Client
                                        </button>
                                    </>
                                )}
                                {selectedClient.status === "active" && !selectedClient.isBlocked && (
                                    <button
                                        className="btn-modal-reject"
                                        onClick={() => {
                                            const clientToBlock = selectedClient;
                                            setSelectedClient(null);
                                            setBlockModal({ isOpen: true, client: clientToBlock });
                                        }}
                                    >
                                        <AlertOctagon size={14} /> Block Client
                                    </button>
                                )}
                                {(selectedClient.status === "blocked" || selectedClient.isBlocked) && (
                                    <button
                                        className="btn-modal-approve"
                                        onClick={() => {
                                            const clientToUnblock = selectedClient;
                                            setSelectedClient(null);
                                            setUnblockModal({ isOpen: true, client: clientToUnblock });
                                        }}
                                    >
                                        <Check size={14} /> Unblock Client
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* BLOCK REASON MODAL */}
                <BlockReasonModal
                    isOpen={blockModal.isOpen}
                    targetType="client"
                    targetName={blockModal.client?.name || ""}
                    onConfirm={handleBlockSubmit}
                    onCancel={() => setBlockModal({ isOpen: false, client: null })}
                    loading={Boolean(processingId)}
                />

                {/* UNBLOCK CONFIRMATION MODAL */}
                <ConfirmationModal
                    isOpen={unblockModal.isOpen}
                    title="Unblock Client Account"
                    message={`Are you sure you want to unblock "${unblockModal.client?.name}"? They will be able to log in and make bookings again.`}
                    type="approve"
                    confirmText="Yes, Unblock Client"
                    onConfirm={handleUnblockSubmit}
                    onCancel={() => setUnblockModal({ isOpen: false, client: null })}
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

export default Clients;

