import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Calendar,
    Search,
    Clock,
    User,
    Mail,
    Phone,
    CheckCircle,
    XCircle,
    CheckCheck,
    X,
    Eye,
    AlertCircle,
    Receipt,
    RefreshCw,
    CreditCard,
    AlertTriangle
} from "lucide-react";
import bookingService from "../../services/bookingService";
import { getImageUrl } from "../../services/api";
import OwnerLayout from "../../components/owner/OwnerLayout";
import "./OwnerBookings.css";

const TABS = [
    { key: "all", label: "All", colorClass: "all" },
    { key: "pending", label: "Pending Verification", colorClass: "pending" },
    { key: "confirmed", label: "Confirmed", colorClass: "confirmed" },
    { key: "completed", label: "Completed", colorClass: "completed" },
    { key: "cancelled", label: "Cancelled / Refunds", colorClass: "cancelled" },
    { key: "rejected", label: "Rejected", colorClass: "rejected" }
];

const OwnerBookings = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [allBookings, setAllBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [search, setSearch] = useState("");
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Financial settlement form fields for cancelled bookings
    const [actualDeductionInput, setActualDeductionInput] = useState("");
    const [refundRefInput, setRefundRefInput] = useState("");

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const data = await bookingService.getOwnerBookings("all");
            setAllBookings(data.bookings || []);
        } catch (err) {
            console.error("Fetch Owner Bookings Error:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to load bookings."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // Handle incoming URL parameters (e.g. from urgent notification clicks)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get("tab");
        const bookingIdParam = params.get("bookingId");

        if (tabParam && ["all", "pending", "confirmed", "completed", "cancelled", "rejected"].includes(tabParam)) {
            setActiveTab(tabParam);
        }

        if (bookingIdParam && allBookings.length > 0) {
            const found = allBookings.find((b) => b._id === bookingIdParam);
            if (found) {
                setSelectedBooking(found);
            }
        }
    }, [location.search, allBookings]);

    // Synchronize deduction input when selectedBooking changes
    useEffect(() => {
        if (selectedBooking && ["Cancelled", "cancelled"].includes(selectedBooking.status)) {
            const maxDed = selectedBooking.cancellationDeduction ?? selectedBooking.maximumCancellationDeduction ?? Math.round(Number(selectedBooking.advanceAmount || 0) * 0.10);
            setActualDeductionInput(
                selectedBooking.actualCancellationDeduction !== undefined && selectedBooking.actualCancellationDeduction !== null
                    ? selectedBooking.actualCancellationDeduction
                    : maxDed
            );
            setRefundRefInput(selectedBooking.refundTransactionReference || "");
        }
    }, [selectedBooking]);

    const handleCompleteBooking = async (id) => {
        const confirmed = window.confirm("Mark this rental booking as completed?");
        if (!confirmed) return;

        try {
            setActionLoading(true);
            await bookingService.completeBooking(id);
            setSuccessMessage("Booking marked as completed.");
            if (selectedBooking?._id === id) {
                setSelectedBooking(null);
            }
            await fetchBookings();
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to update booking."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // Owner handles refund transfer and records actual deduction & UTR
    const handleCompleteRefund = async (id, customRefundData = null) => {
        try {
            let payload = {};
            if (customRefundData) {
                payload = customRefundData;
            } else if (selectedBooking?._id === id) {
                const maxDed = selectedBooking.cancellationDeduction ?? selectedBooking.maximumCancellationDeduction ?? Math.round(Number(selectedBooking.advanceAmount || 0) * 0.10);
                const dedNum = Number(actualDeductionInput);
                if (isNaN(dedNum) || dedNum < 0) {
                    alert("Cancellation deduction amount cannot be negative.");
                    return;
                }
                if (dedNum > maxDed) {
                    alert(`Cancellation deduction cannot exceed the policy fee of ₹${maxDed} (${selectedBooking.cancellationPercentage || 0}% of advance amount).`);
                    return;
                }
                payload = {
                    actualDeduction: dedNum,
                    refundTransactionReference: refundRefInput.trim()
                };
            }

            const confirmed = window.confirm("Confirm that you have transferred the refund amount to the customer's account? This will mark the refund as settled.");
            if (!confirmed) return;

            setActionLoading(true);
            const res = await bookingService.completeRefund(id, payload);
            setSuccessMessage("Refund marked as settled and customer notified.");
            if (selectedBooking?._id === id) {
                setSelectedBooking(res.booking || {
                    ...selectedBooking,
                    refundStatus: "Refunded",
                    paymentStatus: "Refunded",
                    actualCancellationDeduction: payload.actualDeduction,
                    refundTransactionReference: payload.refundTransactionReference
                });
            }
            await fetchBookings();
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to process refund confirmation."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    // Compute dynamic counts across all categories
    const counts = {
        all: allBookings.length,
        pending: allBookings.filter((b) => ["Pending Owner Verification", "pending"].includes(b.status)).length,
        confirmed: allBookings.filter((b) => ["Confirmed", "confirmed"].includes(b.status)).length,
        completed: allBookings.filter((b) => ["Completed", "completed"].includes(b.status)).length,
        cancelled: allBookings.filter((b) => ["Cancelled", "cancelled"].includes(b.status)).length,
        rejected: allBookings.filter((b) => ["Rejected", "rejected"].includes(b.status)).length
    };

    // Filter by tab
    const tabFiltered = allBookings.filter((b) => {
        if (activeTab === "all") return true;
        if (activeTab === "pending") return ["Pending Owner Verification", "pending"].includes(b.status);
        if (activeTab === "confirmed") return ["Confirmed", "confirmed"].includes(b.status);
        if (activeTab === "completed") return ["Completed", "completed"].includes(b.status);
        if (activeTab === "cancelled") return ["Cancelled", "cancelled"].includes(b.status);
        if (activeTab === "rejected") return ["Rejected", "rejected"].includes(b.status);
        return true;
    });

    // Filter by search query
    const filteredBookings = tabFiltered.filter((b) => {
        const query = search.toLowerCase().trim();
        if (!query) return true;

        const bikeName = b.bikeId?.bikeName?.toLowerCase() || "";
        const clientName = (b.customerName || b.userId?.name || "").toLowerCase();
        const clientEmail = (b.userId?.email || "").toLowerCase();

        return (
            bikeName.includes(query) ||
            clientName.includes(query) ||
            clientEmail.includes(query)
        );
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case "Confirmed":
            case "confirmed":
                return <span className="table-status-badge status-confirmed">Confirmed</span>;
            case "Pending Owner Verification":
            case "pending":
                return <span className="table-status-badge status-pending">Pending Verification</span>;
            case "Completed":
            case "completed":
                return <span className="table-status-badge status-completed">Completed</span>;
            case "Rejected":
            case "rejected":
                return <span className="table-status-badge status-rejected">Rejected</span>;
            case "Cancelled":
            case "cancelled":
                return <span className="table-status-badge status-cancelled">Cancelled</span>;
            case "Expired":
                return <span className="table-status-badge status-expired">Expired</span>;
            default:
                return <span className="table-status-badge">{status}</span>;
        }
    };

    const getPaymentBadge = (status) => {
        switch (status) {
            case "Verified":
            case "paid":
                return <span className="table-payment-pill verified">● Verified</span>;
            case "Evidence Submitted":
            case "pending":
                return <span className="table-payment-pill submitted">● Screenshot Submitted</span>;
            case "Refund Pending":
                return <span className="table-payment-pill refund-pending">● Refund Pending</span>;
            case "Refunded":
                return <span className="table-payment-pill refunded">✓ Refunded</span>;
            case "Rejected":
            case "failed":
                return <span className="table-payment-pill rejected">✗ Rejected</span>;
            default:
                return <span className="table-payment-pill">{status}</span>;
        }
    };

    return (
        <OwnerLayout activePage="bookings">
            <div className="owner-bookings-page">
                {/* PAGE HEADER */}
                <div className="bookings-page-header">
                    <div>
                        <span className="owner-role-tag">RENTAL RESERVATIONS & HISTORY</span>
                        <h1>All Bookings</h1>
                        <p>Track all customer reservations, filter by booking status, verify payments, and manage refund settlements.</p>
                    </div>

                    <div className="bookings-summary-badge">
                        <span>{filteredBookings.length} Bookings Shown</span>
                    </div>
                </div>

                {/* ALERTS */}
                {successMessage && (
                    <div className="bookings-alert success">
                        <CheckCircle size={18} />
                        <span>{successMessage}</span>
                    </div>
                )}
                {error && (
                    <div className="bookings-alert error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* TABS & SEARCH TOOLBAR */}
                <div className="bookings-toolbar-card">
                    <div className="bookings-tabs-group">
                        {TABS.map((tab) => {
                            const count = counts[tab.key] || 0;
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    className={`booking-tab-pill ${tab.colorClass} ${isActive ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab.key)}
                                >
                                    <span className="tab-pill-label">{tab.label}</span>
                                    <span className="tab-pill-count">{count}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="bookings-search-field">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search by bike, rider name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* BOOKINGS TABLE */}
                {loading ? (
                    <div className="bookings-loading-state">
                        <div className="spinner"></div>
                        <p>Loading bookings records...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="bookings-empty-state">
                        <div className="empty-icon">📅</div>
                        <h3>No Bookings Found</h3>
                        <p>
                            {search
                                ? "No bookings match your search query."
                                : `No bookings found in category: ${TABS.find((t) => t.key === activeTab)?.label || activeTab}.`}
                        </p>
                    </div>
                ) : (
                    <div className="bookings-table-container">
                        <table className="bookings-table">
                            <thead>
                                <tr>
                                    <th>Bike</th>
                                    <th>Customer / Contact</th>
                                    <th>Rental Period</th>
                                    <th>Financials</th>
                                    <th>Booking Status</th>
                                    <th>Payment Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map((booking) => {
                                    const bike = booking.bikeId || {};
                                    const client = booking.userId || {};
                                    const bikeImg = getImageUrl(bike.image);
                                    const advance = booking.advanceAmount || Math.round(Number(booking.totalAmount) * 0.20);

                                    return (
                                        <tr key={booking._id}>
                                            {/* BIKE */}
                                            <td>
                                                <div className="table-bike-cell">
                                                    <div className="table-bike-img">
                                                        {bikeImg ? (
                                                            <img src={bikeImg} alt={bike.bikeName} />
                                                        ) : (
                                                            <span>🏍️</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <strong>{bike.bikeName || "Bike"}</strong>
                                                        <small>{bike.brand} {bike.model}</small>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* CUSTOMER */}
                                            <td>
                                                <div className="table-customer-cell">
                                                    <strong>{booking.customerName || client.name || "Client"}</strong>
                                                    <small>{booking.customerMobile || client.mobile || client.email}</small>
                                                </div>
                                            </td>

                                            {/* RENTAL PERIOD */}
                                            <td>
                                                <div className="table-date-cell">
                                                    <span>{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</span>
                                                    <small>({booking.totalDays} {booking.totalDays === 1 ? "day" : "days"})</small>
                                                </div>
                                            </td>

                                            {/* FINANCIALS */}
                                            <td>
                                                <div className="table-amount-cell">
                                                    <strong>Total: ₹{booking.totalAmount}</strong>
                                                    <small style={{ color: "#2563eb" }}>Advance: ₹{advance}</small>
                                                </div>
                                            </td>

                                            {/* BOOKING STATUS */}
                                            <td>
                                                {getStatusBadge(booking.status)}
                                            </td>

                                            {/* PAYMENT STATUS */}
                                            <td>
                                                {getPaymentBadge(booking.paymentStatus)}
                                            </td>

                                            {/* ACTION */}
                                            <td>
                                                <div className="table-actions-cell">
                                                    <button
                                                        className="btn-table-view"
                                                        onClick={() => setSelectedBooking(booking)}
                                                        title="View details"
                                                    >
                                                        <Eye size={15} /> Details
                                                    </button>

                                                    {["Confirmed", "confirmed"].includes(booking.status) && (
                                                        <button
                                                            className="btn-table-complete"
                                                            onClick={() => handleCompleteBooking(booking._id)}
                                                            title="Mark as Completed"
                                                            disabled={actionLoading}
                                                        >
                                                            <CheckCheck size={14} /> Complete
                                                        </button>
                                                    )}

                                                    {booking.refundStatus === "Refund Pending" && (
                                                        <button
                                                            className="btn-table-refund"
                                                            onClick={() => setSelectedBooking(booking)}
                                                            title="Manage and settle refund"
                                                            disabled={actionLoading}
                                                        >
                                                            <Receipt size={14} /> Settle Refund
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
                )}

                {/* ==========================================
                    BOOKING DETAIL MODAL
                ========================================== */}
                {selectedBooking && (
                    <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
                        <div className="booking-detail-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Booking #{selectedBooking._id.slice(-6).toUpperCase()}</h2>
                                <button
                                    className="modal-close"
                                    onClick={() => setSelectedBooking(null)}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="modal-status-banner">
                                    <div>
                                        <span>Booking Status:</span>
                                        {getStatusBadge(selectedBooking.status)}
                                    </div>
                                    <div>
                                        <span>Payment Status:</span>
                                        {getPaymentBadge(selectedBooking.paymentStatus)}
                                    </div>
                                </div>

                                <div className="modal-info-section">
                                    <h4>Bike Information</h4>
                                    <div className="modal-info-grid">
                                        <div>
                                            <span>Bike Name:</span>
                                            <strong>{selectedBooking.bikeId?.bikeName}</strong>
                                        </div>
                                        <div>
                                            <span>Brand & Model:</span>
                                            <strong>{selectedBooking.bikeId?.brand} {selectedBooking.bikeId?.model}</strong>
                                        </div>
                                        <div>
                                            <span>Daily Rental Rate:</span>
                                            <strong>₹{selectedBooking.pricePerDay}/day</strong>
                                        </div>
                                        <div>
                                            <span>Location:</span>
                                            <strong>{selectedBooking.bikeId?.location}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-info-section">
                                    <h4>Customer & Contact</h4>
                                    <div className="modal-info-grid">
                                        <div>
                                            <span>Customer Name:</span>
                                            <strong>{selectedBooking.customerName || selectedBooking.userId?.name}</strong>
                                        </div>
                                        <div>
                                            <span>Contact Phone:</span>
                                            <strong>{selectedBooking.customerMobile || selectedBooking.userId?.mobile}</strong>
                                        </div>
                                        <div>
                                            <span>Email Address:</span>
                                            <strong>{selectedBooking.userId?.email}</strong>
                                        </div>
                                        <div>
                                            <span>Driving Licence:</span>
                                            <strong>{selectedBooking.userId?.drivingLicenseNumber || "Provided on file"}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-info-section">
                                    <h4>Schedule & Advance Financials</h4>
                                    <div className="modal-info-grid">
                                        <div>
                                            <span>Rental Dates:</span>
                                            <strong>{formatDate(selectedBooking.startDate)} to {formatDate(selectedBooking.endDate)}</strong>
                                        </div>
                                        <div>
                                            <span>Total Duration:</span>
                                            <strong>{selectedBooking.totalDays} Days</strong>
                                        </div>
                                        <div>
                                            <span>Total Rental Amount:</span>
                                            <strong style={{ fontSize: 15 }}>₹{selectedBooking.totalAmount}</strong>
                                        </div>
                                        <div>
                                            <span>Advance Amount (20%):</span>
                                            <strong style={{ color: "#2563eb", fontSize: 15 }}>₹{selectedBooking.advanceAmount}</strong>
                                        </div>
                                        <div>
                                            <span>Remaining on Pickup:</span>
                                            <strong>₹{selectedBooking.remainingAmount}</strong>
                                        </div>
                                        <div>
                                            <span>Request Date:</span>
                                            <strong>{formatDate(selectedBooking.bookingDate || selectedBooking.createdAt)}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* PAYMENT EVIDENCE IF SUBMITTED */}
                                {selectedBooking.paymentScreenshot && (
                                    <div className="modal-info-section">
                                        <h4>Payment Evidence Screenshot</h4>
                                        <div style={{ textAlign: "center", padding: "10px 0" }}>
                                            <img
                                                src={getImageUrl(selectedBooking.paymentScreenshot)}
                                                alt="Payment Screenshot"
                                                style={{ maxHeight: 220, borderRadius: 8, border: "1px solid #cbd5e1" }}
                                            />
                                            {selectedBooking.paymentTransactionId && (
                                                <p style={{ marginTop: 8, fontSize: 13, color: "#334155" }}>
                                                    Transaction ID / UTR: <strong>{selectedBooking.paymentTransactionId}</strong>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* CANCELLATION & REFUND MANAGEMENT SECTION */}
                                {["Cancelled", "cancelled"].includes(selectedBooking.status) && (
                                    <div className="modal-info-section cancel-summary-section">
                                        <div className="cancel-section-header">
                                            <AlertTriangle size={18} className="cancel-header-icon" />
                                            <div>
                                                <h4>Ride Cancellation & Refund Settlement</h4>
                                                <p>The customer has cancelled this reservation. Process the refund via your banking/UPI application and record the transaction reference.</p>
                                            </div>
                                        </div>

                                        {/* CANCELLATION DETAILS SPECIFIED IN REQUIREMENT 5 */}
                                        <div className="cancel-details-table-card">
                                            <div className="cancel-details-grid">
                                                <div>
                                                    <span>Booking ID:</span>
                                                    <strong>#{selectedBooking._id}</strong>
                                                </div>
                                                <div>
                                                    <span>Customer Name:</span>
                                                    <strong>{selectedBooking.customerName || selectedBooking.userId?.name || "Customer"}</strong>
                                                </div>
                                                <div>
                                                    <span>Bike Name:</span>
                                                    <strong>{selectedBooking.bikeId?.bikeName}</strong>
                                                </div>
                                                <div>
                                                    <span>Rental Start Date:</span>
                                                    <strong>{formatDate(selectedBooking.startDate)}</strong>
                                                </div>
                                                <div>
                                                    <span>Cancellation Date & Time:</span>
                                                    <strong>
                                                        {selectedBooking.cancellationDate || selectedBooking.cancelledAt
                                                            ? new Date(selectedBooking.cancellationDate || selectedBooking.cancelledAt).toLocaleString("en-US", {
                                                                  month: "short",
                                                                  day: "numeric",
                                                                  year: "numeric",
                                                                  hour: "2-digit",
                                                                  minute: "2-digit"
                                                              })
                                                            : "On File"}
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span>Cancellation Reason:</span>
                                                    <strong>{selectedBooking.cancellationReason || "Customer cancelled reservation"}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="cancel-financial-overview-grid">
                                            <div className="cancel-overview-card">
                                                <span>Advance Received</span>
                                                <strong>₹{selectedBooking.advancePaid || selectedBooking.advanceAmount || 0}</strong>
                                            </div>
                                            <div className="cancel-overview-card">
                                                <span>Cancellation Charge</span>
                                                <strong style={{ color: "#d97706" }}>
                                                    {selectedBooking.cancellationPercentage !== undefined ? `${selectedBooking.cancellationPercentage}%` : "Policy"}
                                                </strong>
                                            </div>
                                            <div className="cancel-overview-card">
                                                <span>Deduction Allowed</span>
                                                <strong style={{ color: "#dc2626" }}>
                                                    ₹{selectedBooking.cancellationDeduction ?? selectedBooking.maximumCancellationDeduction ?? 0}
                                                </strong>
                                            </div>
                                            <div className="cancel-overview-card">
                                                <span>Refund Amount</span>
                                                <strong style={{ color: "#16a34a" }}>
                                                    ₹{selectedBooking.refundAmount || 0}
                                                </strong>
                                            </div>
                                            <div className="cancel-overview-card">
                                                <span>Refund Status</span>
                                                <span className={`refund-status-pill ${selectedBooking.refundStatus === "Refunded" ? "settled" : "pending"}`}>
                                                    {selectedBooking.refundStatus === "Refunded" ? "✓ Refunded" : "● Refund Pending"}
                                                </span>
                                            </div>
                                        </div>

                                        {selectedBooking.refundStatus === "Refunded" ? (
                                            <div className="refund-settled-box">
                                                <div className="settled-header">
                                                    <CheckCircle size={18} color="#16a34a" />
                                                    <strong>Refund Successfully Settled & Transferred via UPI / Bank</strong>
                                                </div>
                                                <div className="settled-details-grid">
                                                    <div>
                                                        <span>Actual Deduction Retained:</span>
                                                        <strong>₹{selectedBooking.actualCancellationDeduction ?? selectedBooking.cancellationDeduction ?? 0}</strong>
                                                    </div>
                                                    <div>
                                                        <span>Refund Transferred:</span>
                                                        <strong>₹{selectedBooking.refundAmount || 0}</strong>
                                                    </div>
                                                    <div>
                                                        <span>Bank / UPI Reference (UTR):</span>
                                                        <strong>{selectedBooking.refundTransactionReference || "Settled on File"}</strong>
                                                    </div>
                                                    {selectedBooking.cancelledAt && (
                                                        <div>
                                                            <span>Cancelled At:</span>
                                                            <strong>{formatDate(selectedBooking.cancelledAt)}</strong>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="refund-settlement-form">
                                                <h5>Process & Settle Refund</h5>
                                                <p className="settlement-hint">
                                                    Transfer the refund amount to the customer using your UPI/banking application. You may deduct up to the policy fee of ₹{selectedBooking.cancellationDeduction ?? selectedBooking.maximumCancellationDeduction ?? 0} ({selectedBooking.cancellationPercentage || 0}% of advance received). You cannot increase the deduction beyond the fixed policy percentage.
                                                </p>

                                                <div className="settlement-fields-row">
                                                    <div className="settlement-input-group">
                                                        <label>
                                                            Actual Deduction (₹)
                                                            <small>Max: ₹{selectedBooking.cancellationDeduction ?? selectedBooking.maximumCancellationDeduction ?? 0}</small>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={selectedBooking.cancellationDeduction ?? selectedBooking.maximumCancellationDeduction ?? 0}
                                                            value={actualDeductionInput}
                                                            onChange={(e) => setActualDeductionInput(e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    </div>

                                                    <div className="settlement-calculated-box">
                                                        <span>Calculated Refund to Transfer:</span>
                                                        <strong className="calc-refund-amount">
                                                            ₹{Math.max(0, Number(selectedBooking.advancePaid || selectedBooking.advanceAmount || 0) - (Number(actualDeductionInput) || 0))}
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div className="settlement-input-group" style={{ marginTop: 12 }}>
                                                    <label>Bank / UPI Transfer Reference Number (UTR):</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. UPI/512984102938 or IMPS Ref #..."
                                                        value={refundRefInput}
                                                        onChange={(e) => setRefundRefInput(e.target.value)}
                                                    />
                                                </div>

                                                <div style={{ marginTop: 16 }}>
                                                    <button
                                                        className="btn-modal-refund-action"
                                                        onClick={() => handleCompleteRefund(selectedBooking._id)}
                                                        disabled={actionLoading}
                                                    >
                                                        <Receipt size={16} /> Mark ₹{Math.max(0, Number(selectedBooking.advancePaid || selectedBooking.advanceAmount || 0) - (Number(actualDeductionInput) || 0))} Refunded & Settle
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </OwnerLayout>
    );
};

export default OwnerBookings;
