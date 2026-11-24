import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    Eye,
    MapPin,
    AlertCircle,
    CheckCircle,
    X,
    Info
} from "lucide-react";
import bikeService from "../../services/bikeService";
import { getImageUrl } from "../../services/api";
import OwnerLayout from "../../components/owner/OwnerLayout";
import "./MyBikes.css";

const MyBikes = () => {
    const navigate = useNavigate();

    const [bikes, setBikes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [approvalFilter, setApprovalFilter] = useState("all");
    const [error, setError] = useState("");
    const [selectedBikeDetails, setSelectedBikeDetails] = useState(null);

    const fetchBikes = async () => {
        try {
            setLoading(true);
            const data = await bikeService.getOwnerBikes();
            setBikes(data.bikes || []);
        } catch (err) {
            console.error("Fetch My Bikes Error:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to load bikes."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBikes();
    }, []);

    // ==========================================
    // DELETE BIKE
    // ==========================================
    const handleDelete = async (bikeId, bikeName) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${bikeName}"? This action cannot be undone.`
        );

        if (!confirmDelete) return;

        try {
            await bikeService.deleteBike(bikeId);
            setBikes((prev) => prev.filter((bike) => bike._id !== bikeId));
            if (selectedBikeDetails?._id === bikeId) {
                setSelectedBikeDetails(null);
            }
        } catch (err) {
            console.error("Delete Bike Error:", err);
            alert(
                err.response?.data?.message ||
                err.message ||
                "Unable to delete bike."
            );
        }
    };

    // ==========================================
    // FILTER
    // ==========================================
    const filteredBikes = bikes.filter((bike) => {
        const searchText = search.toLowerCase().trim();

        const matchesSearch =
            !searchText ||
            bike.bikeName?.toLowerCase().includes(searchText) ||
            bike.brand?.toLowerCase().includes(searchText) ||
            bike.model?.toLowerCase().includes(searchText) ||
            bike.location?.toLowerCase().includes(searchText);

        const matchesStatus =
            statusFilter === "all" || bike.status === statusFilter;

        const matchesApproval =
            approvalFilter === "all" || bike.approvalStatus === approvalFilter;

        return matchesSearch && matchesStatus && matchesApproval;
    });

    return (
        <OwnerLayout activePage="bikes">
            <div className="my-bikes-wrapper">
                {/* HEADER */}
                <div className="my-bikes-page-header">
                    <div>
                        <span className="owner-role-tag">FLEET MANAGEMENT</span>
                        <h1>My Bikes</h1>
                        <p>Manage all your rental fleet, update prices, track availability and approval status.</p>
                    </div>

                    <button
                        className="btn-add-bike-primary"
                        onClick={() => navigate("/owner/bikes/add")}
                    >
                        <Plus size={18} />
                        Add New Bike
                    </button>
                </div>

                {/* ERROR NOTIFICATION */}
                {error && (
                    <div className="my-bikes-error-banner">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* TOOLBAR */}
                <div className="my-bikes-toolbar">
                    <div className="search-field">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by bike name, brand, model or location..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <div className="filter-select-box">
                            <label>Availability:</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="available">Available</option>
                                <option value="unavailable">Unavailable</option>
                            </select>
                        </div>

                        <div className="filter-select-box">
                            <label>Approval:</label>
                            <select
                                value={approvalFilter}
                                onChange={(e) => setApprovalFilter(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* RESULT STATS */}
                <div className="bikes-count-row">
                    <span>
                        Showing <strong>{filteredBikes.length}</strong> of {bikes.length} bikes
                    </span>
                </div>

                {/* LOADING / EMPTY / GRID */}
                {loading ? (
                    <div className="my-bikes-loading">
                        <div className="spinner"></div>
                        <p>Loading your bikes...</p>
                    </div>
                ) : filteredBikes.length === 0 ? (
                    <div className="my-bikes-empty">
                        <div className="empty-symbol">🏍️</div>
                        <h3>{bikes.length === 0 ? "No bikes in your fleet yet" : "No bikes match your filters"}</h3>
                        <p>
                            {bikes.length === 0
                                ? "List your bike to start earning rental income on MotoRent."
                                : "Try clearing your search query or reset filter options."}
                        </p>
                        {bikes.length === 0 && (
                            <button
                                className="btn-add-bike-primary"
                                onClick={() => navigate("/owner/bikes/add")}
                                style={{ marginTop: 12 }}
                            >
                                <Plus size={16} /> Add Your First Bike
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="my-bikes-grid">
                        {filteredBikes.map((bike) => {
                            const bikeImg = getImageUrl(bike.image);

                            return (
                                <div className="owner-bike-card" key={bike._id}>
                                    {/* CARD MEDIA */}
                                    <div className="owner-bike-media">
                                        {bikeImg ? (
                                            <img
                                                src={bikeImg}
                                                alt={bike.bikeName}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = "none";
                                                    if (e.currentTarget.nextElementSibling) {
                                                        e.currentTarget.nextElementSibling.style.display = "flex";
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="owner-bike-placeholder"
                                            style={{ display: bikeImg ? "none" : "flex" }}
                                        >
                                            <span>🏍️</span>
                                        </div>

                                        {/* STATUS BADGES */}
                                        <div className="owner-bike-badges">
                                            <span className={`badge-avail ${bike.status}`}>
                                                {bike.status === "available" ? "Available" : "Unavailable"}
                                            </span>
                                            <span className={`badge-approval ${bike.approvalStatus}`}>
                                                Approval: {bike.approvalStatus}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CARD CONTENT */}
                                    <div className="owner-bike-body">
                                        <div className="owner-bike-title-area">
                                            <h3>{bike.bikeName}</h3>
                                            <p className="owner-bike-subtitle">
                                                {bike.brand} • {bike.model}
                                            </p>
                                        </div>

                                        <div className="owner-bike-meta">
                                            <div className="meta-row">
                                                <span>Type:</span>
                                                <strong>{bike.type}</strong>
                                            </div>
                                            <div className="meta-row">
                                                <span>Location:</span>
                                                <strong><MapPin size={13} /> {bike.location}</strong>
                                            </div>
                                            <div className="meta-row price-row">
                                                <span>Rental Rate:</span>
                                                <strong className="rate-val">₹{bike.pricePerDay} <small>/day</small></strong>
                                            </div>
                                        </div>

                                        {/* APPROVAL STATUS BANNER IF PENDING OR REJECTED */}
                                        {bike.approvalStatus === "pending" && (
                                            <div className="approval-notice pending">
                                                <Info size={13} /> Awaiting Admin Approval to appear on marketplace
                                            </div>
                                        )}
                                        {bike.approvalStatus === "rejected" && (
                                            <div className="approval-notice rejected">
                                                <AlertCircle size={13} /> Listing rejected by admin
                                            </div>
                                        )}

                                        {/* CARD ACTIONS */}
                                        <div className="owner-bike-actions">
                                            <button
                                                className="btn-action view"
                                                onClick={() => setSelectedBikeDetails(bike)}
                                                title="View details"
                                            >
                                                <Eye size={15} /> Details
                                            </button>
                                            <button
                                                className="btn-action edit"
                                                onClick={() => navigate(`/owner/bikes/edit/${bike._id}`)}
                                                title="Edit bike"
                                            >
                                                <Edit3 size={15} /> Edit
                                            </button>
                                            <button
                                                className="btn-action delete"
                                                onClick={() => handleDelete(bike._id, bike.bikeName)}
                                                title="Delete bike"
                                            >
                                                <Trash2 size={15} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ==========================================
                    BIKE DETAILS MODAL
                ========================================== */}
                {selectedBikeDetails && (
                    <div
                        className="modal-overlay"
                        onClick={() => setSelectedBikeDetails(null)}
                    >
                        <div
                            className="bike-detail-modal"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>{selectedBikeDetails.bikeName} Details</h2>
                                <button
                                    className="modal-close"
                                    onClick={() => setSelectedBikeDetails(null)}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="modal-img-container">
                                    {selectedBikeDetails.image ? (
                                        <img
                                            src={getImageUrl(selectedBikeDetails.image)}
                                            alt={selectedBikeDetails.bikeName}
                                        />
                                    ) : (
                                        <div className="modal-no-img">🏍️ No Image Uploaded</div>
                                    )}
                                </div>

                                <div className="modal-details-grid">
                                    <div className="modal-item">
                                        <span>Brand:</span>
                                        <strong>{selectedBikeDetails.brand}</strong>
                                    </div>
                                    <div className="modal-item">
                                        <span>Model:</span>
                                        <strong>{selectedBikeDetails.model}</strong>
                                    </div>
                                    <div className="modal-item">
                                        <span>Bike Type:</span>
                                        <strong>{selectedBikeDetails.type}</strong>
                                    </div>
                                    <div className="modal-item">
                                        <span>Price Per Day:</span>
                                        <strong style={{ color: "#2563eb" }}>₹{selectedBikeDetails.pricePerDay} / day</strong>
                                    </div>
                                    <div className="modal-item">
                                        <span>Pickup Location:</span>
                                        <strong>{selectedBikeDetails.location}</strong>
                                    </div>
                                    <div className="modal-item">
                                        <span>Availability:</span>
                                        <strong className={`badge-avail ${selectedBikeDetails.status}`}>
                                            {selectedBikeDetails.status}
                                        </strong>
                                    </div>
                                    <div className="modal-item">
                                        <span>Admin Approval:</span>
                                        <strong className={`badge-approval ${selectedBikeDetails.approvalStatus}`}>
                                            {selectedBikeDetails.approvalStatus}
                                        </strong>
                                    </div>
                                    <div className="modal-item">
                                        <span>Listing ID:</span>
                                        <code>{selectedBikeDetails._id}</code>
                                    </div>
                                </div>

                                <div className="modal-footer-actions">
                                    <button
                                        className="btn-modal-edit"
                                        onClick={() => {
                                            navigate(`/owner/bikes/edit/${selectedBikeDetails._id}`);
                                            setSelectedBikeDetails(null);
                                        }}
                                    >
                                        <Edit3 size={16} /> Edit Bike
                                    </button>
                                    <button
                                        className="btn-modal-close"
                                        onClick={() => setSelectedBikeDetails(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </OwnerLayout>
    );
};

export default MyBikes;