import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Calendar,
    CalendarDays,
    Bike,
    Clock,
    MapPin,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    Phone,
    Mail,
    User,
    LogOut,
    Eye,
    X,
    CreditCard,
    Receipt,
    HelpCircle,
    AlertTriangle
} from "lucide-react";
import useAuth from "../../context/useAuth";
import bookingService from "../../services/bookingService";
import { getImageUrl } from "../../services/api";
import NotificationBell from "../../components/NotificationBell";
import CustomerNavbar from "../../components/common/CustomerNavbar";
import "./MyBookings.css";

const MyBookings = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [cancelModalBooking, setCancelModalBooking] = useState(null);
    const [cancellationReason, setCancellationReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchMyBookings = async () => {
        try {
            setLoading(true);
            const data = await bookingService.getMyBookings();
            setBookings(data.bookings || []);
        } catch (err) {
            console.error("Fetch My Bookings Error:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to load your bookings."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token") || localStorage.getItem("motorent_token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchMyBookings();
    }, [navigate]);

    // FEATURE 7: Cancellation with deduction calculation
    const handleConfirmCancel = async () => {
        if (!cancelModalBooking) return;

        try {
            setActionLoading(true);
            await bookingService.cancelBooking(cancelModalBooking._id, cancellationReason.trim());
            setCancelModalBooking(null);
            setCancellationReason("");
            if (selectedBooking?._id === cancelModalBooking._id) {
                setSelectedBooking(null);
            }
            await fetchMyBookings();
        } catch (err) {
            alert(err.response?.data?.message || err.message || "Failed to cancel booking.");
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

    // Time-based cancellation policy preview calculation
    const calculateClientCancellationPreview = (startDate, advanceAmount) => {
        const cancelTime = Date.now();
        const startTime = new Date(startDate).getTime();
        const diffMs = startTime - cancelTime;
        const hoursRemaining = diffMs / (1000 * 60 * 60);

        let percentage = 60;
        if (hoursRemaining >= 96) {
            percentage = 10;
        } else if (hoursRemaining >= 72) {
            percentage = 20;
        } else if (hoursRemaining >= 48) {
            percentage = 30;
        } else if (hoursRemaining > 24) {
            percentage = 30;
        } else {
            percentage = 60;
        }

        const advance = Number(advanceAmount) || 0;
        const deduction = Math.round((advance * percentage) / 100);
        const refund = Math.max(0, advance - deduction);

        return {
            percentage,
            deduction,
            refund,
            hoursRemaining,
            requestTimeStr: new Date(cancelTime).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })
        };
    };

    // FEATURE 10: Standardized Booking Statuses
    const getBookingStatusBadge = (status) => {
        switch (status) {
            case "Confirmed":
            case "confirmed":
                return (
                    <span className="client-status-badge confirmed">
                        <CheckCircle2 size={13} /> Confirmed
                    </span>
                );
            case "Pending Owner Verification":
            case "pending":
                return (
                    <span className="client-status-badge pending">
                        <Clock size={13} /> Pending Owner Verification
                    </span>
                );
            case "Pending Payment":
                return (
                    <span className="client-status-badge pending-payment">
                        <CreditCard size={13} /> Pending Payment
                    </span>
                );
            case "Rejected":
            case "rejected":
                return (
                    <span className="client-status-badge rejected">
                        <XCircle size={13} /> Rejected
                    </span>
                );
            case "Cancelled":
            case "cancelled":
                return (
                    <span className="client-status-badge cancelled">
                        <X size={13} /> Cancelled
                    </span>
                );
            case "Active":
                return (
                    <span className="client-status-badge active-ride">
                        <Bike size={13} /> Active Rental
                    </span>
                );
            case "Completed":
            case "completed":
                return (
                    <span className="client-status-badge completed">
                        <CheckCircle2 size={13} /> Completed
                    </span>
                );
            case "Expired":
                return (
                    <span className="client-status-badge expired">
                        <Clock size={13} /> Expired
                    </span>
                );
            default:
                return <span className="client-status-badge">{status}</span>;
        }
    };

    // FEATURE 10: Standardized Payment Statuses
    const getPaymentStatusBadge = (status) => {
        switch (status) {
            case "Verified":
            case "paid":
                return <span className="client-payment-badge verified">● Payment Verified</span>;
            case "Evidence Submitted":
            case "pending":
                return <span className="client-payment-badge submitted">● Screenshot Submitted</span>;
            case "Not Paid":
                return <span className="client-payment-badge not-paid">● Not Paid</span>;
            case "Refund Pending":
                return <span className="client-payment-badge refund-pending">● Refund Pending</span>;
            case "Refunded":
                return <span className="client-payment-badge refunded">✓ Refunded</span>;
            case "Rejected":
            case "failed":
                return <span className="client-payment-badge rejected">✗ Payment Rejected</span>;
            default:
                return <span className="client-payment-badge">{status}</span>;
        }
    };

    return (
        <div className="client-bookings-page">
            {/* TOP NAVBAR (FEATURE 2) */}
            <CustomerNavbar activePage="bookings" />

            {/* MAIN CONTENT */}
            <main className="client-bookings-container">
                <div className="bookings-header-row">
                    <div>
                        <h1>My Bike Bookings</h1>
                        <p>Track your rental reservations, advance payment statuses, and owner confirmation updates.</p>
                    </div>

                    <Link to="/" className="btn-new-rental">
                        + Rent Another Bike
                    </Link>
                </div>

                {error && (
                    <div className="bookings-alert-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="client-loading-box">
                        <div className="spinner"></div>
                        <p>Loading your rental bookings...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="client-empty-bookings">
                        <div className="empty-icon">🏍️</div>
                        <h3>No Bookings Yet</h3>
                        <p>You haven't reserved any bikes yet. Browse available bikes and start your adventure!</p>
                        <Link to="/" className="btn-explore-empty">
                            Browse Available Bikes
                        </Link>
                    </div>
                ) : (
                    <div className="client-bookings-list">
                        {bookings.map((booking) => {
                            const bike = booking.bikeId || {};
                            const owner = booking.ownerId || {};
                            const bikeImg = getImageUrl(bike.image);

                            const isCancelable = [
                                "Pending Owner Verification",
                                "pending",
                                "Confirmed",
                                "confirmed"
                            ].includes(booking.status);

                            return (
                                <div key={booking._id} className="client-booking-card">
                                    <div className="card-top-row">
                                        <div className="booking-ref">
                                            <span>Booking ID:</span>
                                            <strong>#{booking._id.slice(-6).toUpperCase()}</strong>
                                        </div>
                                        <div className="card-top-badges">
                                            {getBookingStatusBadge(booking.status)}
                                            {getPaymentStatusBadge(booking.paymentStatus)}
                                        </div>
                                    </div>

                                    <div className="card-main-body">
                                        <div className="card-bike-preview">
                                            {bikeImg ? (
                                                <img src={bikeImg} alt={bike.bikeName} />
                                            ) : (
                                                <div className="placeholder-box">🏍️</div>
                                            )}
                                        </div>

                                        <div className="card-info-col">
                                            <h3>{bike.bikeName || "Rental Bike"}</h3>
                                            <p className="card-model-text">
                                                {bike.brand} {bike.model} • {bike.type}
                                            </p>
                                            <p className="card-loc-text">
                                                <MapPin size={14} /> Pickup Location: {bike.location || "City Location"}
                                            </p>

                                            {/* OWNER CONTACT */}
                                            <div className="confirmed-owner-box">
                                                <strong>Owner:</strong>
                                                <span>{owner.businessName || owner.name || "Bike Owner"} ({owner.mobile || "Phone on file"})</span>
                                            </div>

                                            {/* REJECTION REASON IF REJECTED */}
                                            {booking.rejectionReason && (
                                                <div className="rejection-note-box">
                                                    <strong>Owner Rejection Note:</strong>
                                                    <span>{booking.rejectionReason}</span>
                                                </div>
                                            )}

                                            {/* REFUND STATUS IF CANCELLED */}
                                            {booking.status === "Cancelled" && (
                                                <div className="refund-summary-box">
                                                    <span>Advance Paid: ₹{booking.advanceAmount}</span>
                                                    <span>Deduction: ₹{booking.cancellationDeduction || 0}</span>
                                                    <strong>Refund Due: ₹{booking.refundAmount || 0} ({booking.refundStatus || "Refund Pending"})</strong>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card-schedule-col">
                                            <div className="schedule-box">
                                                <div className="schedule-point">
                                                    <small>Start Date</small>
                                                    <strong>{formatDate(booking.startDate)}</strong>
                                                </div>
                                                <span className="schedule-arrow">→</span>
                                                <div className="schedule-point">
                                                    <small>End Date</small>
                                                    <strong>{formatDate(booking.endDate)}</strong>
                                                </div>
                                            </div>
                                            <span className="duration-tag">
                                                {booking.totalDays} {booking.totalDays === 1 ? "Day" : "Days"} Total
                                            </span>
                                        </div>

                                        <div className="card-price-col">
                                            <span className="price-tag-label">Total Rental</span>
                                            <strong className="price-tag-value">₹{booking.totalAmount}</strong>
                                            <div className="advance-paid-label">
                                                Advance: <strong>₹{booking.advanceAmount || Math.round(booking.totalAmount * 0.20)}</strong>
                                            </div>
                                            <small className="price-daily-sub">Remaining: ₹{booking.remainingAmount || (booking.totalAmount - (booking.advanceAmount || Math.round(booking.totalAmount * 0.20)))}</small>

                                            <div className="card-btns-group">
                                                <button
                                                    className="btn-card-details"
                                                    onClick={() => setSelectedBooking(booking)}
                                                >
                                                    <Eye size={14} /> Details
                                                </button>

                                                {isCancelable && (
                                                    <button
                                                        className="btn-card-cancel"
                                                        onClick={() => setCancelModalBooking(booking)}
                                                        disabled={actionLoading}
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ==========================================
                    BOOKING DETAILS MODAL
                ========================================== */}
                {selectedBooking && (
                    <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
                        <div className="client-modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="client-modal-header">
                                <div>
                                    <h2>Booking Details</h2>
                                    <small>Booking #{selectedBooking._id.slice(-6).toUpperCase()}</small>
                                </div>
                                <button className="modal-close-btn" onClick={() => setSelectedBooking(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="client-modal-body">
                                <div className="modal-status-highlight">
                                    <div>
                                        <span>Booking Status:</span>
                                        {getBookingStatusBadge(selectedBooking.status)}
                                    </div>
                                    <div>
                                        <span>Payment Status:</span>
                                        {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                                    </div>
                                </div>

                                <div className="modal-section-block">
                                    <h4>Bike Details</h4>
                                    <div className="modal-2col">
                                        <div>
                                            <span>Bike:</span>
                                            <strong>{selectedBooking.bikeId?.bikeName}</strong>
                                        </div>
                                        <div>
                                            <span>Brand & Model:</span>
                                            <strong>{selectedBooking.bikeId?.brand} {selectedBooking.bikeId?.model}</strong>
                                        </div>
                                        <div>
                                            <span>Location:</span>
                                            <strong>{selectedBooking.bikeId?.location}</strong>
                                        </div>
                                        <div>
                                            <span>Rate per Day:</span>
                                            <strong>₹{selectedBooking.pricePerDay}/day</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-section-block">
                                    <h4>Schedule & Financial Summary</h4>
                                    <div className="modal-2col">
                                        <div>
                                            <span>Start Date:</span>
                                            <strong>{formatDate(selectedBooking.startDate)}</strong>
                                        </div>
                                        <div>
                                            <span>End Date:</span>
                                            <strong>{formatDate(selectedBooking.endDate)}</strong>
                                        </div>
                                        <div>
                                            <span>Total Days:</span>
                                            <strong>{selectedBooking.totalDays} Days</strong>
                                        </div>
                                        <div>
                                            <span>Total Amount:</span>
                                            <strong style={{ color: "#0f172a", fontSize: "15px" }}>₹{selectedBooking.totalAmount}</strong>
                                        </div>
                                        <div>
                                            <span>Advance (20%):</span>
                                            <strong style={{ color: "#2563eb", fontSize: "15px" }}>₹{selectedBooking.advanceAmount}</strong>
                                        </div>
                                        <div>
                                            <span>Remaining on Pickup:</span>
                                            <strong>₹{selectedBooking.remainingAmount}</strong>
                                        </div>
                                    </div>
                                </div>

                                {selectedBooking.ownerId && (
                                    <div className="modal-section-block">
                                        <h4>Owner Contact & Pickup</h4>
                                        <div className="modal-2col">
                                            <div>
                                                <span>Owner / Business:</span>
                                                <strong>{selectedBooking.ownerId.businessName || selectedBooking.ownerId.name}</strong>
                                            </div>
                                            <div>
                                                <span>Contact Phone:</span>
                                                <strong>{selectedBooking.ownerId.mobile || "Available in app"}</strong>
                                            </div>
                                            <div>
                                                <span>Email:</span>
                                                <strong>{selectedBooking.ownerId.email}</strong>
                                            </div>
                                            <div>
                                                <span>Address:</span>
                                                <strong>{selectedBooking.ownerId.address || selectedBooking.bikeId?.location}</strong>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedBooking.paymentScreenshot && (
                                    <div className="modal-section-block">
                                        <h4>Uploaded Payment Evidence</h4>
                                        <div className="modal-evidence-preview">
                                            <img
                                                src={getImageUrl(selectedBooking.paymentScreenshot)}
                                                alt="Payment Screenshot"
                                                style={{ maxHeight: 180, borderRadius: 8, border: "1px solid #cbd5e1" }}
                                            />
                                            {selectedBooking.paymentTransactionId && (
                                                <small style={{ marginTop: 6, display: "block" }}>
                                                    Transaction Ref: <strong>{selectedBooking.paymentTransactionId}</strong>
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedBooking.rejectionReason && (
                                    <div className="modal-section-block alert-rejection">
                                        <h4>Rejection Reason</h4>
                                        <p>{selectedBooking.rejectionReason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ==========================================
                    FEATURE 4: CANCELLATION CONFIRMATION MODAL
                ========================================== */}
                {cancelModalBooking && (
                    <div className="modal-overlay" onClick={() => !actionLoading && setCancelModalBooking(null)}>
                        <div className="cancellation-dialog-card" onClick={(e) => e.stopPropagation()}>
                            <div className="cancel-dialog-header">
                                <div className="cancel-dialog-badge">
                                    <AlertTriangle size={24} color="#dc2626" />
                                </div>
                                <div>
                                    <h3>Confirm Ride Cancellation?</h3>
                                    <span className="cancel-dialog-sub">
                                        Booking #{cancelModalBooking._id.slice(-6).toUpperCase()} • {cancelModalBooking.bikeId?.bikeName}
                                    </span>
                                </div>
                            </div>

                            <div className="cancel-policy-rules-box">
                                <div className="policy-box-title">Cancellation Policy:</div>
                                <ul className="policy-rules-list">
                                    <li><strong>4 days or more before rental:</strong> 10% deduction</li>
                                    <li><strong>3 days or more but less than 4 days:</strong> 20% deduction</li>
                                    <li><strong>2 days or more but less than 3 days:</strong> 30% deduction</li>
                                    <li><strong>More than 24 hours but less than 2 days:</strong> 30% deduction</li>
                                    <li><strong>24 hours or less:</strong> 60% deduction</li>
                                </ul>
                            </div>

                            {/* CANCELLATION DEDUCTION & ESTIMATED REFUND BREAKDOWN */}
                            {(() => {
                                const advancePaid = Number(cancelModalBooking.advancePaid || cancelModalBooking.advanceAmount) || Math.round(Number(cancelModalBooking.totalAmount || 0) * 0.20);
                                const preview = calculateClientCancellationPreview(cancelModalBooking.startDate, advancePaid);

                                return (
                                    <div className="cancel-breakdown-card">
                                        <div className="breakdown-title">Ride & Refund Summary</div>
                                        <div className="breakdown-row">
                                            <span>Bike Name:</span>
                                            <strong>{cancelModalBooking.bikeId?.bikeName || "Rental Bike"}</strong>
                                        </div>
                                        <div className="breakdown-row">
                                            <span>Rental Start Date:</span>
                                            <strong>{formatDate(cancelModalBooking.startDate)}</strong>
                                        </div>
                                        <div className="breakdown-row">
                                            <span>Cancellation Request Date & Time:</span>
                                            <strong style={{ fontSize: "12.5px" }}>{preview.requestTimeStr}</strong>
                                        </div>
                                        <div className="breakdown-row highlight-advance">
                                            <span>Advance Amount Paid:</span>
                                            <strong>₹{advancePaid.toLocaleString()}</strong>
                                        </div>
                                        <div className="breakdown-row">
                                            <span>Applicable Cancellation Percentage:</span>
                                            <strong className="text-orange">{preview.percentage}% deduction</strong>
                                        </div>
                                        <div className="breakdown-row highlight-deduction">
                                            <span>Cancellation Deduction:</span>
                                            <strong className="text-red">- ₹{preview.deduction.toLocaleString()}</strong>
                                        </div>
                                        <div className="breakdown-row highlight-refund">
                                            <span>Final Refund Amount:</span>
                                            <strong className="text-green">₹{preview.refund.toLocaleString()}</strong>
                                        </div>
                                        <div className="breakdown-policy-note">
                                            * Note: The cancellation percentage is automatically calculated based on the exact time remaining until the rental start date. The refund amount will be processed via owner bank/UPI transfer within 24 hours.
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="cancel-reason-group">
                                <label htmlFor="cancelReasonInput">Reason for cancellation (Optional):</label>
                                <textarea
                                    id="cancelReasonInput"
                                    rows={2}
                                    placeholder="e.g. Change of travel plans, unexpected schedule conflict..."
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                />
                            </div>

                            <div className="cancel-dialog-actions">
                                <button
                                    className="btn-cancel-dismiss"
                                    onClick={() => setCancelModalBooking(null)}
                                    disabled={actionLoading}
                                >
                                    Keep My Booking
                                </button>
                                <button
                                    className="btn-cancel-proceed"
                                    onClick={handleConfirmCancel}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? "Cancelling..." : "Confirm Cancellation"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyBookings;
