import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Inbox,
    CheckCircle2,
    XCircle,
    Calendar,
    Clock,
    User,
    Mail,
    Phone,
    MapPin,
    AlertCircle,
    Check,
    X,
    CreditCard,
    Eye,
    FileText,
    ShieldCheck,
    CalendarDays,
    IndianRupee,
    Info,
    ZoomIn,
    Maximize2,
    QrCode,
    Receipt
} from "lucide-react";
import bookingService from "../../services/bookingService";
import { getImageUrl } from "../../services/api";
import OwnerLayout from "../../components/owner/OwnerLayout";
import "./BookingRequests.css";

const BookingRequests = () => {
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Modal States
    const [selectedCustomerModal, setSelectedCustomerModal] = useState(null);
    const [fullImageModal, setFullImageModal] = useState(null); // { url, title, subtitle, meta }
    const [actionModal, setActionModal] = useState(null); // { type: 'accept' | 'reject', request: {...} }
    const [rejectionReason, setRejectionReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await bookingService.getOwnerRequests();
            setRequests(data.requests || []);
        } catch (err) {
            console.error("Fetch Booking Requests Error:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to load booking verification requests."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleConfirmAction = async () => {
        if (!actionModal) return;
        const { type, request } = actionModal;

        try {
            setSubmitting(true);
            setError("");

            if (type === "accept") {
                await bookingService.acceptBooking(request._id);
                setSuccessMessage(
                    `Booking for ${request.bikeId?.bikeName || "the bike"} has been approved and confirmed! Customer has been notified.`
                );
            } else {
                await bookingService.rejectBooking(request._id, rejectionReason.trim());
                setSuccessMessage("Booking request rejected and bike reservation released.");
            }

            setActionModal(null);
            setRejectionReason("");
            setSelectedCustomerModal(null);
            setFullImageModal(null);
            await fetchRequests();
            setTimeout(() => setSuccessMessage(""), 5000);
        } catch (err) {
            console.error("Booking Action Error:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to process booking verification."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const formatTimestamp = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatShortId = (id) => {
        if (!id) return "";
        return `BK-${id.slice(-6).toUpperCase()}`;
    };

    return (
        <OwnerLayout activePage="booking-requests">
            <div className="booking-requests-page">
                {/* =========================================
                    PAGE HEADER: FEATURE 6 ADVANCE PAYMENT VERIFICATION
                ========================================= */}
                <div className="requests-page-header">
                    <div>
                        <span className="owner-role-tag">OWNER PORTAL • VERIFICATION</span>
                        <h1>Advance Payment Verification</h1>
                        <p>
                            Review incoming customer booking requests, verify advance payment transaction screenshots against the minimum 20% advance requirement, and approve or reject reservations.
                        </p>
                    </div>

                    <div className="requests-header-count">
                        <span className="count-number">{requests.length}</span>
                        <span className="count-label">Awaiting Verification</span>
                    </div>
                </div>

                {/* NOTIFICATIONS / ALERTS */}
                {successMessage && (
                    <div className="requests-alert success">
                        <CheckCircle2 size={18} />
                        <span>{successMessage}</span>
                    </div>
                )}

                {error && (
                    <div className="requests-alert error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* =========================================
                    REQUESTS LIST
                ========================================= */}
                {loading ? (
                    <div className="requests-loading-state">
                        <div className="spinner"></div>
                        <p>Loading advance payment verification requests...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="requests-empty-card">
                        <div className="empty-inbox-icon">
                            <Receipt size={48} />
                        </div>
                        <h3>No Pending Verifications</h3>
                        <p>
                            All customer booking requests and payment screenshots have been reviewed. When riders submit advance payments for your bikes, they will appear here for verification.
                        </p>
                        <button
                            className="btn-view-bookings"
                            onClick={() => navigate("/owner/bookings")}
                        >
                            View Confirmed Bookings & History →
                        </button>
                    </div>
                ) : (
                    <div className="requests-grid">
                        {requests.map((req) => {
                            const bike = req.bikeId || {};
                            const bikeImg = getImageUrl(bike.image);
                            const client = req.userId || {};
                            const dlNumber = client.drivingLicenseNumber || "Not Provided";
                            const dlImage = client.drivingLicenseImage;
                            const paymentImg = getImageUrl(req.paymentScreenshot);

                            const total = Number(req.totalAmount) || 0;
                            const requiredAdvance = Math.round(total * 0.20);
                            const submittedAdvance = Number(req.advanceAmount) || requiredAdvance;
                            const remaining = req.remainingAmount !== undefined ? Number(req.remainingAmount) : total - submittedAdvance;

                            return (
                                <div key={req._id} className="booking-request-card">
                                    {/* TOP BAR */}
                                    <div className="request-card-topbar">
                                        <div className="request-topbar-left">
                                            <span className="booking-id-tag">
                                                {formatShortId(req._id)}
                                            </span>
                                            <div className="request-timestamp">
                                                <Clock size={13} />
                                                <span>Request Date: {formatTimestamp(req.bookingDate || req.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className="topbar-status-tags">
                                            <span className="status-pill pending">
                                                ● {req.status || "Pending Owner Verification"}
                                            </span>
                                            <span className="status-pill payment">
                                                💳 {req.paymentStatus || "Evidence Submitted"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="request-card-content">
                                        {/* BIKE DETAILS */}
                                        <div className="request-bike-info">
                                            <div className="request-bike-image">
                                                {bikeImg ? (
                                                    <img src={bikeImg} alt={bike.bikeName} />
                                                ) : (
                                                    <div className="img-placeholder">🏍️</div>
                                                )}
                                            </div>
                                            <div className="request-bike-text">
                                                <h3>{bike.bikeName || "Rental Bike"}</h3>
                                                <p className="request-bike-model">
                                                    {bike.brand} {bike.model} • <span className="bike-type-badge">{bike.type}</span>
                                                </p>
                                                <p className="request-bike-location">
                                                    <MapPin size={13} /> {bike.location || "Location not specified"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* CUSTOMER CONTACT & DL */}
                                        <div className="request-customer-info">
                                            <span className="section-subtitle">Customer Contact</span>
                                            <div className="customer-row">
                                                <User size={15} />
                                                <strong>{req.customerName || client.name || "Customer"}</strong>
                                            </div>
                                            <div className="customer-row">
                                                <Phone size={15} />
                                                <span>{req.customerMobile || client.mobile || "Phone not provided"}</span>
                                            </div>
                                            <div className="customer-row">
                                                <Mail size={15} />
                                                <span>{client.email || "Email not available"}</span>
                                            </div>

                                            {/* DRIVING LICENCE BADGE */}
                                            <div className="customer-dl-box">
                                                <div className="dl-info-line">
                                                    <CreditCard size={14} className="dl-icon" />
                                                    <span className="dl-label">DL No:</span>
                                                    <span className="dl-number">{dlNumber}</span>
                                                </div>
                                                {dlImage && (
                                                    <button
                                                        type="button"
                                                        className="btn-view-dl-inline"
                                                        onClick={() => setFullImageModal({
                                                            url: getImageUrl(dlImage),
                                                            title: "Driving Licence",
                                                            subtitle: `Rider: ${req.customerName || client.name} • DL: ${dlNumber}`
                                                        })}
                                                    >
                                                        <Eye size={12} /> View DL
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* RENTAL SCHEDULE & DURATION */}
                                        <div className="request-rental-details">
                                            <span className="section-subtitle">Rental Schedule & Duration</span>
                                            <div className="rental-period-box">
                                                <div className="date-block">
                                                    <span className="date-label">Start Date</span>
                                                    <strong>{formatDate(req.startDate)}</strong>
                                                </div>
                                                <div className="date-arrow">→</div>
                                                <div className="date-block">
                                                    <span className="date-label">End Date</span>
                                                    <strong>{formatDate(req.endDate)}</strong>
                                                </div>
                                            </div>
                                            <div className="duration-pill">
                                                <Clock size={13} /> Duration: <strong>{req.totalDays} {req.totalDays === 1 ? "day" : "days"}</strong>
                                            </div>
                                        </div>

                                        {/* FEATURE 6: PAYMENT EVIDENCE & FINANCIAL BREAKDOWN */}
                                        <div className="request-payment-box">
                                            <span className="section-subtitle">Payment Breakdown & Screenshot</span>

                                            <div className="financial-grid">
                                                <div className="fin-item">
                                                    <span>Total Amount:</span>
                                                    <strong>₹{total}</strong>
                                                </div>
                                                <div className="fin-item">
                                                    <span>Required Advance (20%):</span>
                                                    <strong>₹{requiredAdvance}</strong>
                                                </div>
                                                <div className="fin-item highlight-advance">
                                                    <span>Submitted Advance:</span>
                                                    <strong>₹{submittedAdvance}</strong>
                                                </div>
                                                <div className="fin-item">
                                                    <span>Remaining on Pickup:</span>
                                                    <strong>₹{remaining}</strong>
                                                </div>
                                            </div>

                                            {req.paymentTransactionId && (
                                                <div className="utr-number-badge">
                                                    <span>UTR / Ref: <strong>{req.paymentTransactionId}</strong></span>
                                                </div>
                                            )}

                                            {/* PAYMENT SCREENSHOT PREVIEW */}
                                            <div className="payment-screenshot-preview-container">
                                                <span className="screenshot-label">Payment Screenshot:</span>
                                                {paymentImg ? (
                                                    <div
                                                        className="screenshot-clickable-thumbnail"
                                                        onClick={() => setFullImageModal({
                                                            url: paymentImg,
                                                            title: "Advance Payment Screenshot",
                                                            subtitle: `Rider: ${req.customerName || client.name} • Submitted Advance: ₹${submittedAdvance}`,
                                                            meta: `Bike: ${bike.bikeName} • Total: ₹${total} • Remaining: ₹${remaining}`
                                                        })}
                                                        title="Click to view full-size payment screenshot"
                                                    >
                                                        <img src={paymentImg} alt="Transaction Evidence" />
                                                        <div className="thumbnail-zoom-hint">
                                                            <ZoomIn size={16} /> Click to Enlarge
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="no-screenshot-box">
                                                        <AlertCircle size={16} /> No screenshot uploaded
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ACTION BUTTONS (FEATURE 6 REQUIREMENT) */}
                                    <div className="request-card-actions">
                                        <div className="action-buttons-group verification-actions">
                                            <button
                                                type="button"
                                                className="btn-request-reject"
                                                onClick={() => {
                                                    setActionModal({ type: "reject", request: req });
                                                    setRejectionReason("");
                                                }}
                                            >
                                                <X size={16} /> Reject Booking
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-request-accept"
                                                onClick={() => setActionModal({ type: "accept", request: req })}
                                            >
                                                <Check size={16} /> Approve Booking
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ===================================================
                    FULL-SIZE IMAGE VIEWER MODAL (SCREENSHOT / DL)
                =================================================== */}
                {fullImageModal && (
                    <div className="modal-overlay full-image-backdrop" onClick={() => setFullImageModal(null)}>
                        <div className="full-image-viewer-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="full-image-header">
                                <div className="full-image-title-group">
                                    <Receipt size={20} className="text-blue" />
                                    <div>
                                        <h3>{fullImageModal.title}</h3>
                                        <span className="full-image-sub">{fullImageModal.subtitle}</span>
                                    </div>
                                </div>
                                <button
                                    className="full-image-close"
                                    onClick={() => setFullImageModal(null)}
                                    title="Close viewer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="full-image-body">
                                <img
                                    src={fullImageModal.url}
                                    alt="Enlarged Document"
                                    className="full-licence-image"
                                />
                            </div>

                            <div className="full-image-footer">
                                {fullImageModal.meta && (
                                    <span className="viewer-meta-text">{fullImageModal.meta}</span>
                                )}
                                <button
                                    className="btn-close-viewer"
                                    onClick={() => setFullImageModal(null)}
                                >
                                    Close Full Preview
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===================================================
                    APPROVE / REJECT CONFIRMATION MODAL (FEATURE 6)
                =================================================== */}
                {actionModal && (
                    <div className="modal-overlay" onClick={() => !submitting && setActionModal(null)}>
                        <div className="confirm-action-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-icon-header">
                                {actionModal.type === "accept" ? (
                                    <div className="confirm-icon accept">
                                        <CheckCircle2 size={36} />
                                    </div>
                                ) : (
                                    <div className="confirm-icon reject">
                                        <XCircle size={36} />
                                    </div>
                                )}
                            </div>

                            <h2>
                                {actionModal.type === "accept"
                                    ? "Approve & Confirm Booking"
                                    : "Reject Booking Request"}
                            </h2>

                            <p className="confirm-modal-desc">
                                {actionModal.type === "accept"
                                    ? "Confirming this booking marks the payment status as Verified, sets the booking status as Confirmed, and notifies the customer."
                                    : "Rejecting this booking releases the temporary bike reservation, sets status as Rejected, and notifies the customer."}
                            </p>

                            <div className="modal-summary-box">
                                <div className="sum-row">
                                    <span>Customer:</span>
                                    <strong>{actionModal.request.customerName || actionModal.request.userId?.name}</strong>
                                </div>
                                <div className="sum-row">
                                    <span>Bike:</span>
                                    <strong>{actionModal.request.bikeId?.bikeName}</strong>
                                </div>
                                <div className="sum-row">
                                    <span>Rental Dates:</span>
                                    <strong>{formatDate(actionModal.request.startDate)} to {formatDate(actionModal.request.endDate)}</strong>
                                </div>
                                <div className="sum-row">
                                    <span>Total Amount:</span>
                                    <strong>₹{actionModal.request.totalAmount}</strong>
                                </div>
                                <div className="sum-row">
                                    <span>Advance Paid:</span>
                                    <strong style={{ color: "#2563eb", fontSize: 15 }}>
                                        ₹{actionModal.request.advanceAmount || Math.round(actionModal.request.totalAmount * 0.20)}
                                    </strong>
                                </div>
                            </div>

                            {/* REJECTION REASON INPUT (FEATURE 6 REQUIREMENT) */}
                            {actionModal.type === "reject" && (
                                <div className="rejection-reason-container">
                                    <label htmlFor="rejectionReasonInput">
                                        Enter Rejection Reason *
                                    </label>
                                    <textarea
                                        id="rejectionReasonInput"
                                        rows={3}
                                        placeholder="e.g. Payment not credited on bank statement, wrong transaction screenshot, or bike unavailable."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <div className="confirm-modal-actions">
                                <button
                                    className="btn-modal-cancel"
                                    onClick={() => setActionModal(null)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={`btn-modal-confirm ${actionModal.type === "accept" ? "accept" : "reject"}`}
                                    onClick={handleConfirmAction}
                                    disabled={submitting || (actionModal.type === "reject" && !rejectionReason.trim())}
                                >
                                    {submitting
                                        ? "Processing..."
                                        : actionModal.type === "accept"
                                        ? "Approve Booking"
                                        : "Confirm Rejection"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </OwnerLayout>
    );
};

export default BookingRequests;
