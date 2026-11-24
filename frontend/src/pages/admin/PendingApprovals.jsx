import { useState, useEffect, useMemo } from "react";
import {
    Users,
    Store,
    Bike,
    Clock,
    Search,
    X,
    Check,
    Eye,
    CheckCircle2,
    Calendar,
    MapPin,
    Phone,
    Mail,
    Building2,
    ShieldCheck,
    AlertOctagon,
    IndianRupee,
    Tag,
    CreditCard
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import ConfirmationModal from "../../components/admin/ConfirmationModal";
import adminService from "../../services/adminService";
import { getImageUrl } from "../../services/api";
import "./PendingApprovals.css";

const PendingApprovals = () => {
    const [data, setData] = useState({
        summary: { clients: 0, owners: 0, bikes: 0, total: 0 },
        clients: [],
        owners: [],
        bikes: []
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all"); // "all" | "clients" | "owners" | "bikes"

    // Action Confirmation Modal
    const [actionModal, setActionModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "approve",
        confirmText: "Confirm",
        onConfirm: null
    });
    const [processingId, setProcessingId] = useState(null);

    // View Details Modal
    const [detailsItem, setDetailsItem] = useState(null); // { item, type: 'client'|'owner'|'bike' }

    // Toast Notification
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 4000);
    };

    const loadPendingData = async () => {
        try {
            const res = await adminService.getPendingApprovals();
            if (res) {
                setData({
                    summary: res.summary || { clients: 0, owners: 0, bikes: 0, total: 0 },
                    clients: res.clients || [],
                    owners: res.owners || [],
                    bikes: res.bikes || []
                });
            }
        } catch (error) {
            console.error("Failed to load pending approvals:", error);
            showToast(error.response?.data?.message || "Failed to load pending approvals", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPendingData();
    }, []);

    // Helper: format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const d = new Date(dateString);
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    // Client-side search filters
    const filteredClients = useMemo(() => {
        if (!searchQuery.trim()) return data.clients;
        const q = searchQuery.toLowerCase().trim();
        return data.clients.filter((client) =>
            client.name?.toLowerCase().includes(q) ||
            client.email?.toLowerCase().includes(q) ||
            client.mobile?.toLowerCase().includes(q)
        );
    }, [data.clients, searchQuery]);

    const filteredOwners = useMemo(() => {
        if (!searchQuery.trim()) return data.owners;
        const q = searchQuery.toLowerCase().trim();
        return data.owners.filter((owner) =>
            owner.name?.toLowerCase().includes(q) ||
            owner.email?.toLowerCase().includes(q) ||
            owner.mobile?.toLowerCase().includes(q) ||
            owner.businessName?.toLowerCase().includes(q) ||
            owner.address?.toLowerCase().includes(q)
        );
    }, [data.owners, searchQuery]);

    const filteredBikes = useMemo(() => {
        if (!searchQuery.trim()) return data.bikes;
        const q = searchQuery.toLowerCase().trim();
        return data.bikes.filter((bike) =>
            bike.bikeName?.toLowerCase().includes(q) ||
            bike.brand?.toLowerCase().includes(q) ||
            bike.model?.toLowerCase().includes(q) ||
            bike.type?.toLowerCase().includes(q) ||
            bike.location?.toLowerCase().includes(q) ||
            bike.ownerId?.name?.toLowerCase().includes(q) ||
            bike.ownerId?.businessName?.toLowerCase().includes(q)
        );
    }, [data.bikes, searchQuery]);

    // Summary counts
    const totalPendingCount = data.summary.total;
    const clientsCount = data.clients.length;
    const ownersCount = data.owners.length;
    const bikesCount = data.bikes.length;

    // Handle Approve
    const handleApprove = (item, type) => {
        const isClient = type === "client";
        const isOwner = type === "owner";
        const isBike = type === "bike";
        const itemName = item.name || item.bikeName || "Record";

        const title = `Approve ${isBike ? "Bike Listing" : isOwner ? "Bike Owner" : "Client"}`;
        const message = `Are you sure you want to approve "${itemName}"? Once approved, it will become active on the platform.`;

        setActionModal({
            isOpen: true,
            title,
            message,
            type: "approve",
            confirmText: "Yes, Approve",
            onConfirm: async () => {
                try {
                    setProcessingId(item._id);
                    if (isClient) {
                        await adminService.approveClient(item._id);
                        showToast(`Client "${itemName}" approved successfully!`);
                    } else if (isOwner) {
                        await adminService.approveOwner(item._id);
                        showToast(`Bike owner "${itemName}" approved successfully!`);
                    } else if (isBike) {
                        await adminService.approveBike(item._id);
                        showToast(`Bike listing "${itemName}" approved and is now live!`);
                    }
                    setActionModal((prev) => ({ ...prev, isOpen: false }));
                    if (detailsItem?.item?._id === item._id) {
                        setDetailsItem(null);
                    }
                    await loadPendingData();
                } catch (error) {
                    showToast(error.response?.data?.message || error.message || "Approval failed", "error");
                } finally {
                    setProcessingId(null);
                }
            }
        });
    };

    // Handle Reject
    const handleReject = (item, type) => {
        const isClient = type === "client";
        const isOwner = type === "owner";
        const isBike = type === "bike";
        const itemName = item.name || item.bikeName || "Record";

        const title = `Reject ${isBike ? "Bike Listing" : isOwner ? "Bike Owner" : "Client"}`;
        const message = `Are you sure you want to reject "${itemName}"? This item will be rejected and will not be activated.`;

        setActionModal({
            isOpen: true,
            title,
            message,
            type: "reject",
            confirmText: "Yes, Reject",
            onConfirm: async () => {
                try {
                    setProcessingId(item._id);
                    if (isClient) {
                        await adminService.rejectClient(item._id);
                        showToast(`Client registration "${itemName}" rejected.`);
                    } else if (isOwner) {
                        await adminService.rejectOwner(item._id);
                        showToast(`Bike owner "${itemName}" registration rejected.`);
                    } else if (isBike) {
                        await adminService.rejectBike(item._id);
                        showToast(`Bike listing "${itemName}" rejected.`);
                    }
                    setActionModal((prev) => ({ ...prev, isOpen: false }));
                    if (detailsItem?.item?._id === item._id) {
                        setDetailsItem(null);
                    }
                    await loadPendingData();
                } catch (error) {
                    showToast(error.response?.data?.message || error.message || "Rejection failed", "error");
                } finally {
                    setProcessingId(null);
                }
            }
        });
    };

    // Helper to determine if a section should show
    const showClientsSection = (activeTab === "all" || activeTab === "clients") && (filteredClients.length > 0 || activeTab === "clients");
    const showOwnersSection = (activeTab === "all" || activeTab === "owners") && (filteredOwners.length > 0 || activeTab === "owners");
    const showBikesSection = (activeTab === "all" || activeTab === "bikes") && (filteredBikes.length > 0 || activeTab === "bikes");

    const totalFilteredResults =
        (activeTab === "all"
            ? filteredClients.length + filteredOwners.length + filteredBikes.length
            : activeTab === "clients"
                ? filteredClients.length
                : activeTab === "owners"
                    ? filteredOwners.length
                    : filteredBikes.length);

    return (
        <AdminLayout title="Pending Approvals">
            <div className="pending-approvals-page">
                {/* PAGE HEADER */}
                <div className="pending-page-header">
                    <div className="pending-header-content">
                        <h2>Pending Approvals</h2>
                        <p>Review and approve new users and bike listings before they become active.</p>
                    </div>
                </div>

                {/* SUMMARY METRICS CARDS */}
                <div className="pending-summary-grid">
                    {/* 1. TOTAL PENDING */}
                    <div
                        className={`pending-summary-card ${activeTab === "all" ? "active-filter" : ""}`}
                        onClick={() => setActiveTab("all")}
                        style={{ cursor: "pointer" }}
                    >
                        <div className="summary-icon-box total">
                            <Clock size={22} />
                        </div>
                        <div className="summary-info">
                            <span className="summary-title">Total Pending</span>
                            <strong className="summary-count text-orange">{loading ? "..." : totalPendingCount}</strong>
                            <span className="summary-subtitle">Requires administrator action</span>
                        </div>
                    </div>

                    {/* 2. PENDING CLIENTS */}
                    <div
                        className={`pending-summary-card ${activeTab === "clients" ? "active-filter" : ""}`}
                        onClick={() => setActiveTab("clients")}
                        style={{ cursor: "pointer" }}
                    >
                        <div className="summary-icon-box clients">
                            <Users size={22} />
                        </div>
                        <div className="summary-info">
                            <span className="summary-title">Pending Clients</span>
                            <strong className="summary-count">{loading ? "..." : clientsCount}</strong>
                            <span className="summary-subtitle">Awaiting account review</span>
                        </div>
                    </div>

                    {/* 3. PENDING OWNERS */}
                    <div
                        className={`pending-summary-card ${activeTab === "owners" ? "active-filter" : ""}`}
                        onClick={() => setActiveTab("owners")}
                        style={{ cursor: "pointer" }}
                    >
                        <div className="summary-icon-box owners">
                            <Store size={22} />
                        </div>
                        <div className="summary-info">
                            <span className="summary-title">Pending Owners</span>
                            <strong className="summary-count">{loading ? "..." : ownersCount}</strong>
                            <span className="summary-subtitle">Partner verification</span>
                        </div>
                    </div>

                    {/* 4. PENDING BIKES */}
                    <div
                        className={`pending-summary-card ${activeTab === "bikes" ? "active-filter" : ""}`}
                        onClick={() => setActiveTab("bikes")}
                        style={{ cursor: "pointer" }}
                    >
                        <div className="summary-icon-box bikes">
                            <Bike size={22} />
                        </div>
                        <div className="summary-info">
                            <span className="summary-title">Pending Bikes</span>
                            <strong className="summary-count">{loading ? "..." : bikesCount}</strong>
                            <span className="summary-subtitle">Listings to moderate</span>
                        </div>
                    </div>
                </div>

                {/* CONTROLS: TABS & SEARCH */}
                <div className="pending-controls-bar">
                    {/* FILTER TABS */}
                    <div className="pending-filter-tabs">
                        <button
                            className={`filter-tab-btn ${activeTab === "all" ? "active" : ""}`}
                            onClick={() => setActiveTab("all")}
                        >
                            <span>All</span>
                            <span className="tab-badge">{totalPendingCount}</span>
                        </button>
                        <button
                            className={`filter-tab-btn ${activeTab === "clients" ? "active" : ""}`}
                            onClick={() => setActiveTab("clients")}
                        >
                            <span>Clients</span>
                            <span className="tab-badge">{clientsCount}</span>
                        </button>
                        <button
                            className={`filter-tab-btn ${activeTab === "owners" ? "active" : ""}`}
                            onClick={() => setActiveTab("owners")}
                        >
                            <span>Bike Owners</span>
                            <span className="tab-badge">{ownersCount}</span>
                        </button>
                        <button
                            className={`filter-tab-btn ${activeTab === "bikes" ? "active" : ""}`}
                            onClick={() => setActiveTab("bikes")}
                        >
                            <span>Bikes</span>
                            <span className="tab-badge">{bikesCount}</span>
                        </button>
                    </div>

                    {/* SEARCH BOX */}
                    <div className="pending-search-box">
                        <Search className="search-input-icon" size={16} />
                        <input
                            type="text"
                            className="pending-search-input"
                            placeholder="Search pending approvals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="search-clear-btn"
                                onClick={() => setSearchQuery("")}
                                title="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                {loading ? (
                    <div className="pending-loading-state">
                        <div className="pending-spinner"></div>
                        <p>Loading pending approvals from database...</p>
                    </div>
                ) : totalPendingCount === 0 ? (
                    /* EMPTY STATE WHEN EVERYTHING IS APPROVED */
                    <div className="pending-empty-state">
                        <div className="empty-state-icon-wrapper">
                            <CheckCircle2 size={38} />
                        </div>
                        <h3>No Pending Approvals</h3>
                        <p>All users and bike listings have been reviewed. There are no pending approval requests at this time.</p>
                    </div>
                ) : totalFilteredResults === 0 && searchQuery ? (
                    /* EMPTY STATE WHEN SEARCH HAS NO MATCHES */
                    <div className="pending-empty-state">
                        <div className="empty-state-icon-wrapper search">
                            <Search size={32} />
                        </div>
                        <h3>No Matching Records</h3>
                        <p>No pending approvals match your search term "{searchQuery}".</p>
                        <button
                            className="btn-card-action btn-view-details"
                            style={{ maxWidth: 160 }}
                            onClick={() => setSearchQuery("")}
                        >
                            Clear Search Filter
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* 1. PENDING CLIENTS SECTION */}
                        {showClientsSection && (
                            <div className="pending-section-block">
                                <div className="section-title-row">
                                    <div className="section-title-left">
                                        <Users size={18} className="text-blue" />
                                        <h3>Pending Clients</h3>
                                        <span className="section-count-badge">
                                            {filteredClients.length} Pending
                                        </span>
                                    </div>
                                </div>

                                {filteredClients.length === 0 ? (
                                    <div className="card-empty-state" style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                                        <Users size={28} className="text-muted" />
                                        <p>No pending client registrations.</p>
                                    </div>
                                ) : (
                                    <div className="pending-items-grid">
                                        {filteredClients.map((client) => (
                                            <div className="pending-card" key={client._id}>
                                                <div>
                                                    <div className="pending-card-top">
                                                        <div className="pending-avatar client">
                                                            {client.name?.charAt(0)?.toUpperCase() || "C"}
                                                        </div>
                                                        <div className="pending-primary-meta">
                                                            <h4 className="pending-item-name">{client.name}</h4>
                                                            <p className="pending-item-email">{client.email}</p>
                                                            <span className="pending-role-badge client">Client</span>
                                                        </div>
                                                    </div>

                                                    <div className="pending-meta-list">
                                                        <div className="meta-row">
                                                            <span className="meta-label">
                                                                <Phone size={13} /> Phone
                                                            </span>
                                                            <span className="meta-value">{client.mobile || "N/A"}</span>
                                                        </div>
                                                        <div className="meta-row">
                                                            <span className="meta-label">
                                                                <CreditCard size={13} /> DL No
                                                            </span>
                                                            <span className="meta-value" style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e40af" }}>
                                                                {client.drivingLicenseNumber || "Not provided"}
                                                            </span>
                                                        </div>
                                                        <div className="meta-row">
                                                            <span className="meta-label">
                                                                <Calendar size={13} /> Registered
                                                            </span>
                                                            <span className="meta-value">{formatDate(client.createdAt)}</span>
                                                        </div>
                                                        <div className="meta-row">
                                                            <span className="meta-label">
                                                                <Clock size={13} /> Status
                                                            </span>
                                                            <span className="pending-status-chip">
                                                                <span className="status-dot-pulse"></span> Pending
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pending-card-actions">
                                                    <button
                                                        className="btn-card-action btn-view-details"
                                                        onClick={() => setDetailsItem({ item: client, type: "client" })}
                                                    >
                                                        <Eye size={14} /> View Details
                                                    </button>
                                                    <button
                                                        className="btn-card-action btn-approve-action"
                                                        onClick={() => handleApprove(client, "client")}
                                                        disabled={processingId === client._id}
                                                    >
                                                        <Check size={14} /> Approve
                                                    </button>
                                                    <button
                                                        className="btn-card-action btn-reject-action"
                                                        onClick={() => handleReject(client, "client")}
                                                        disabled={processingId === client._id}
                                                    >
                                                        <X size={14} /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. PENDING BIKE OWNERS SECTION */}
                        {showOwnersSection && (
                            <div className="pending-section-block">
                                <div className="section-title-row">
                                    <div className="section-title-left">
                                        <Store size={18} className="text-purple" />
                                        <h3>Pending Bike Owners</h3>
                                        <span className="section-count-badge">
                                            {filteredOwners.length} Pending
                                        </span>
                                    </div>
                                </div>

                                {filteredOwners.length === 0 ? (
                                    <div className="card-empty-state" style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                                        <Store size={28} className="text-muted" />
                                        <p>No pending bike owner registrations.</p>
                                    </div>
                                ) : (
                                    <div className="pending-items-grid">
                                        {filteredOwners.map((owner) => (
                                            <div className="pending-card" key={owner._id}>
                                                <div>
                                                    <div className="pending-card-top">
                                                        <div className="pending-avatar owner">
                                                            {owner.name?.charAt(0)?.toUpperCase() || "O"}
                                                        </div>
                                                        <div className="pending-primary-meta">
                                                            <h4 className="pending-item-name">{owner.name}</h4>
                                                            <p className="pending-item-email">{owner.email}</p>
                                                            <span className="pending-role-badge owner">
                                                                {owner.businessName ? `Owner • ${owner.businessName}` : "Bike Owner"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="pending-meta-list">
                                                        <div className="meta-row">
                                                            <span className="meta-label">
                                                                <Phone size={13} /> Phone
                                                            </span>
                                                            <span className="meta-value">{owner.mobile || "N/A"}</span>
                                                        </div>
                                                        {owner.businessName && (
                                                            <div className="meta-row">
                                                                <span className="meta-label">
                                                                    <Building2 size={13} /> Business
                                                                </span>
                                                                <span className="meta-value">{owner.businessName}</span>
                                                            </div>
                                                        )}
                                                        <div className="meta-row">
                                                            <span className="meta-label">
                                                                <Bike size={13} /> Bikes Listed
                                                            </span>
                                                            <span className="meta-value">{owner.bikeCount || 0} Bikes</span>
                                                        </div>
                                                        <div className="meta-row">
                                                            <span className="meta-label">
                                                                <Calendar size={13} /> Registered
                                                            </span>
                                                            <span className="meta-value">{formatDate(owner.createdAt)}</span>
                                                        </div>
                                                        <div className="meta-row">
                                                            <span className="meta-label">
                                                                <Clock size={13} /> Status
                                                            </span>
                                                            <span className="pending-status-chip">
                                                                <span className="status-dot-pulse"></span> Pending
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pending-card-actions">
                                                    <button
                                                        className="btn-card-action btn-view-details"
                                                        onClick={() => setDetailsItem({ item: owner, type: "owner" })}
                                                    >
                                                        <Eye size={14} /> View Details
                                                    </button>
                                                    <button
                                                        className="btn-card-action btn-approve-action"
                                                        onClick={() => handleApprove(owner, "owner")}
                                                        disabled={processingId === owner._id}
                                                    >
                                                        <Check size={14} /> Approve
                                                    </button>
                                                    <button
                                                        className="btn-card-action btn-reject-action"
                                                        onClick={() => handleReject(owner, "owner")}
                                                        disabled={processingId === owner._id}
                                                    >
                                                        <X size={14} /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. PENDING BIKES SECTION */}
                        {showBikesSection && (
                            <div className="pending-section-block">
                                <div className="section-title-row">
                                    <div className="section-title-left">
                                        <Bike size={18} className="text-green" />
                                        <h3>Pending Bikes</h3>
                                        <span className="section-count-badge">
                                            {filteredBikes.length} Pending
                                        </span>
                                    </div>
                                </div>

                                {filteredBikes.length === 0 ? (
                                    <div className="card-empty-state" style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                                        <Bike size={28} className="text-muted" />
                                        <p>No pending bike listings to moderate.</p>
                                    </div>
                                ) : (
                                    <div className="pending-items-grid">
                                        {filteredBikes.map((bike) => {
                                            const imgUrl = getImageUrl(bike.image);
                                            return (
                                                <div className="pending-bike-card" key={bike._id}>
                                                    <div>
                                                        {/* BIKE IMAGE BOX */}
                                                        <div className="pending-bike-image-box">
                                                            {imgUrl ? (
                                                                <img src={imgUrl} alt={bike.bikeName} />
                                                            ) : (
                                                                <span className="bike-img-placeholder">🏍️</span>
                                                            )}
                                                            <span className="bike-type-tag">{bike.type || "Bike"}</span>
                                                            <span className="bike-price-tag">
                                                                ₹{bike.pricePerDay} / Day
                                                            </span>
                                                        </div>

                                                        {/* BIKE DETAILS */}
                                                        <div className="pending-bike-body">
                                                            <div className="pending-bike-title-row">
                                                                <h4 className="pending-bike-title">{bike.bikeName}</h4>
                                                                <p className="pending-bike-spec">
                                                                    {bike.brand} {bike.model}
                                                                </p>
                                                            </div>

                                                            <div className="pending-meta-list">
                                                                <div className="meta-row">
                                                                    <span className="meta-label">
                                                                        <Tag size={13} /> Type
                                                                    </span>
                                                                    <span className="meta-value">{bike.type}</span>
                                                                </div>
                                                                <div className="meta-row">
                                                                    <span className="meta-label">
                                                                        <IndianRupee size={13} /> Price
                                                                    </span>
                                                                    <span className="meta-value text-blue">₹{bike.pricePerDay} / Day</span>
                                                                </div>
                                                                <div className="meta-row">
                                                                    <span className="meta-label">
                                                                        <MapPin size={13} /> Location
                                                                    </span>
                                                                    <span className="meta-value" title={bike.location}>
                                                                        {bike.location}
                                                                    </span>
                                                                </div>
                                                                <div className="meta-row">
                                                                    <span className="meta-label">
                                                                        <Store size={13} /> Owner
                                                                    </span>
                                                                    <span className="meta-value">
                                                                        {bike.ownerId?.name || "Verified Owner"}
                                                                    </span>
                                                                </div>
                                                                <div className="meta-row">
                                                                    <span className="meta-label">
                                                                        <Calendar size={13} /> Date Added
                                                                    </span>
                                                                    <span className="meta-value">{formatDate(bike.createdAt)}</span>
                                                                </div>
                                                                <div className="meta-row">
                                                                    <span className="meta-label">
                                                                        <Clock size={13} /> Status
                                                                    </span>
                                                                    <span className="pending-status-chip">
                                                                        <span className="status-dot-pulse"></span> Pending
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pending-card-actions" style={{ padding: "0 16px 16px 16px" }}>
                                                        <button
                                                            className="btn-card-action btn-view-details"
                                                            onClick={() => setDetailsItem({ item: bike, type: "bike" })}
                                                        >
                                                            <Eye size={14} /> View Details
                                                        </button>
                                                        <button
                                                            className="btn-card-action btn-approve-action"
                                                            onClick={() => handleApprove(bike, "bike")}
                                                            disabled={processingId === bike._id}
                                                        >
                                                            <Check size={14} /> Approve
                                                        </button>
                                                        <button
                                                            className="btn-card-action btn-reject-action"
                                                            onClick={() => handleReject(bike, "bike")}
                                                            disabled={processingId === bike._id}
                                                        >
                                                            <X size={14} /> Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* VIEW DETAILS MODAL */}
                {detailsItem && (
                    <div className="details-modal-backdrop" onClick={() => setDetailsItem(null)}>
                        <div className="details-modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="details-modal-header">
                                <div className="modal-header-badge-group">
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                                        {detailsItem.type === "client"
                                            ? "Client Details"
                                            : detailsItem.type === "owner"
                                                ? "Bike Owner Details"
                                                : "Bike Listing Details"}
                                    </h3>
                                    <span className="pending-status-chip">
                                        <span className="status-dot-pulse"></span> Pending Review
                                    </span>
                                </div>
                                <button className="details-modal-close" onClick={() => setDetailsItem(null)}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="details-modal-body">
                                {/* BIKE HERO IMAGE IF BIKE */}
                                {detailsItem.type === "bike" && (
                                    <div className="details-bike-hero-image">
                                        {getImageUrl(detailsItem.item.image) ? (
                                            <img
                                                src={getImageUrl(detailsItem.item.image)}
                                                alt={detailsItem.item.bikeName}
                                            />
                                        ) : (
                                            <span style={{ fontSize: 60 }}>🏍️</span>
                                        )}
                                    </div>
                                )}

                                {/* CLIENT DETAILS VIEW */}
                                {detailsItem.type === "client" && (
                                    <div className="details-info-grid">
                                        <div className="details-info-item">
                                            <span className="info-label">Full Name</span>
                                            <span className="info-val">{detailsItem.item.name}</span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Account Role</span>
                                            <span className="info-val" style={{ textTransform: "capitalize" }}>
                                                {detailsItem.item.role || "Customer"}
                                            </span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Email Address</span>
                                            <span className="info-val">{detailsItem.item.email}</span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Phone / Mobile</span>
                                            <span className="info-val">{detailsItem.item.mobile || "N/A"}</span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Driving Licence Number</span>
                                            <span className="info-val" style={{ fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8" }}>
                                                {detailsItem.item.drivingLicenseNumber || "Not provided"}
                                            </span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Registration Date</span>
                                            <span className="info-val">{formatDate(detailsItem.item.createdAt)}</span>
                                        </div>
                                        <div className="details-info-item full-width">
                                            <span className="info-label">Account Status</span>
                                            <span className="info-val text-orange" style={{ fontWeight: 700 }}>
                                                {detailsItem.item.status || "pending"}
                                            </span>
                                        </div>
                                        {detailsItem.item.drivingLicenseImage && (
                                            <div className="details-info-item full-width" style={{ marginTop: 10 }}>
                                                <span className="info-label">Driving Licence Document Photo</span>
                                                <div style={{
                                                    marginTop: 8,
                                                    background: "#0f172a",
                                                    borderRadius: 12,
                                                    padding: 12,
                                                    textAlign: "center",
                                                    maxHeight: 280,
                                                    overflow: "hidden",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    border: "1px solid #334155"
                                                }}>
                                                    <img
                                                        src={getImageUrl(detailsItem.item.drivingLicenseImage)}
                                                        alt={`Licence of ${detailsItem.item.name}`}
                                                        style={{ maxWidth: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 6 }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* OWNER DETAILS VIEW */}
                                {detailsItem.type === "owner" && (
                                    <div className="details-info-grid">
                                        <div className="details-info-item">
                                            <span className="info-label">Owner Full Name</span>
                                            <span className="info-val">{detailsItem.item.name}</span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Business Name</span>
                                            <span className="info-val">{detailsItem.item.businessName || "N/A"}</span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Email Address</span>
                                            <span className="info-val">{detailsItem.item.email}</span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Phone / Mobile</span>
                                            <span className="info-val">{detailsItem.item.mobile || "N/A"}</span>
                                        </div>
                                        <div className="details-info-item full-width">
                                            <span className="info-label">Business Address</span>
                                            <span className="info-val">{detailsItem.item.address || "N/A"}</span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Registration Date</span>
                                            <span className="info-val">{formatDate(detailsItem.item.createdAt)}</span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Current Fleet Count</span>
                                            <span className="info-val">{detailsItem.item.bikeCount || 0} Bikes</span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Account Status</span>
                                            <span className="info-val text-orange" style={{ fontWeight: 700 }}>
                                                {detailsItem.item.status || "pending"}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* BIKE DETAILS VIEW */}
                                {detailsItem.type === "bike" && (
                                    <div className="details-info-grid">
                                        <div className="details-info-item">
                                            <span className="info-label">Bike Name</span>
                                            <span className="info-val">{detailsItem.item.bikeName}</span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Brand & Model</span>
                                            <span className="info-val">
                                                {detailsItem.item.brand} {detailsItem.item.model}
                                            </span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Bike Type</span>
                                            <span className="info-val">{detailsItem.item.type}</span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Price Per Day</span>
                                            <span className="info-val text-blue" style={{ fontWeight: 800 }}>
                                                ₹{detailsItem.item.pricePerDay} / Day
                                            </span>
                                        </div>
                                        <div className="details-info-item full-width">
                                            <span className="info-label">Rental Location</span>
                                            <span className="info-val">{detailsItem.item.location}</span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Bike Owner</span>
                                            <span className="info-val">
                                                {detailsItem.item.ownerId?.name || "N/A"}
                                                {detailsItem.item.ownerId?.businessName ? ` (${detailsItem.item.ownerId.businessName})` : ""}
                                            </span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Owner Contact</span>
                                            <span className="info-val">
                                                {detailsItem.item.ownerId?.email || detailsItem.item.ownerId?.mobile || "N/A"}
                                            </span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Date Submitted</span>
                                            <span className="info-val">{formatDate(detailsItem.item.createdAt)}</span>
                                        </div>
                                        <div className="details-info-item">
                                            <span className="info-label">Approval Status</span>
                                            <span className="info-val text-orange" style={{ fontWeight: 700 }}>
                                                {detailsItem.item.approvalStatus || "pending"}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="details-modal-actions">
                                <button className="btn-modal-close" onClick={() => setDetailsItem(null)}>
                                    Close
                                </button>
                                <button
                                    className="btn-modal-reject"
                                    onClick={() => handleReject(detailsItem.item, detailsItem.type)}
                                    disabled={processingId === detailsItem.item._id}
                                >
                                    <X size={15} /> Reject
                                </button>
                                <button
                                    className="btn-modal-approve"
                                    onClick={() => handleApprove(detailsItem.item, detailsItem.type)}
                                    disabled={processingId === detailsItem.item._id}
                                >
                                    <Check size={15} /> Approve
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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

                {/* TOAST NOTIFICATION */}
                {toast.show && (
                    <div className={`pending-toast-notification ${toast.type}`}>
                        {toast.type === "success" ? <Check size={18} /> : <AlertOctagon size={18} />}
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

export default PendingApprovals;
