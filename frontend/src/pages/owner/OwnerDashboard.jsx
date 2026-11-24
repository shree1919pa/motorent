import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bike,
    CalendarDays,
    CheckCircle2,
    Clock,
    IndianRupee,
    Plus,
    Inbox,
    ArrowRight,
    MapPin,
    AlertCircle
} from "lucide-react";
import useAuth from "../../context/useAuth";
import bikeService from "../../services/bikeService";
import bookingService from "../../services/bookingService";
import { getImageUrl } from "../../services/api";
import OwnerLayout from "../../components/owner/OwnerLayout";
import "./OwnerDashboard.css";

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [stats, setStats] = useState({
        totalBikes: 0,
        totalRequests: 0,
        confirmedBookings: 0,
        totalEarnings: 0,
        pendingRequests: 0
    });
    const [recentRequests, setRecentRequests] = useState([]);
    const [ownerBikes, setOwnerBikes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [feedback, setFeedback] = useState(null);

    const currentUser = user || (() => {
        try {
            const raw = localStorage.getItem("user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, requestsRes, bikesRes] = await Promise.all([
                bookingService.getOwnerStats(),
                bookingService.getOwnerRequests(),
                bikeService.getOwnerBikes()
            ]);

            if (statsRes && statsRes.stats) {
                setStats(statsRes.stats);
            }
            if (requestsRes && requestsRes.requests) {
                setRecentRequests(requestsRes.requests.slice(0, 4));
            }
            if (bikesRes && bikesRes.bikes) {
                setOwnerBikes(bikesRes.bikes);
            }
        } catch (err) {
            console.error("Failed to load owner dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handleAcceptRequest = async (id, bikeName) => {
        const confirmed = window.confirm(`Are you sure you want to accept this booking request for ${bikeName}?`);
        if (!confirmed) return;

        try {
            setActionLoading(id);
            await bookingService.acceptBooking(id);
            setFeedback({
                type: "success",
                message: "Booking confirmed successfully."
            });
            await loadDashboardData();
        } catch (err) {
            setFeedback({
                type: "error",
                message: err.response?.data?.message || err.message || "Failed to accept booking."
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectRequest = async (id, bikeName) => {
        const confirmed = window.confirm(`Are you sure you want to reject this booking request for ${bikeName}?`);
        if (!confirmed) return;

        try {
            setActionLoading(id);
            await bookingService.rejectBooking(id);
            setFeedback({
                type: "info",
                message: "Booking request rejected."
            });
            await loadDashboardData();
        } catch (err) {
            setFeedback({
                type: "error",
                message: err.response?.data?.message || err.message || "Failed to reject booking."
            });
        } finally {
            setActionLoading(null);
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

    return (
        <OwnerLayout activePage="dashboard">
            <div className="owner-dash-page">
                {/* ==========================================
                    WELCOME BANNER
                ========================================== */}
                <div className="owner-welcome-header">
                    <div className="welcome-text">
                        <span className="owner-role-tag">Bike Owner Panel</span>
                        <h1>Welcome back, {currentUser?.name || "Owner"} 👋</h1>
                        <p>
                            {currentUser?.businessName ? `${currentUser.businessName} • ` : ""}
                            Manage your listed bikes, respond to booking requests, and track your rental earnings in real time.
                        </p>
                    </div>

                    <div className="welcome-actions">
                        <button
                            className="dash-cta-btn secondary"
                            onClick={() => navigate("/owner/booking-requests")}
                            style={{ background: "#eff6ff", color: "#2563eb", border: "1.5px solid #bfdbfe" }}
                        >
                            <Inbox size={16} /> Payment Verifications {stats.pendingRequests > 0 && `(${stats.pendingRequests})`}
                        </button>
                        <button
                            className="dash-cta-btn"
                            onClick={() => navigate("/owner/bikes/add")}
                        >
                            <Plus size={18} />
                            Add New Bike
                        </button>
                    </div>
                </div>

                {/* FEEDBACK TOAST / ALERT */}
                {feedback && (
                    <div className={`dash-alert ${feedback.type}`}>
                        <div className="alert-content">
                            <AlertCircle size={18} />
                            <span>{feedback.message}</span>
                        </div>
                        <button onClick={() => setFeedback(null)}>×</button>
                    </div>
                )}

                {/* ==========================================
                    5 REQUIRED DASHBOARD CARDS
                ========================================== */}
                <section className="dash-metrics-grid">
                    {/* 1. Total Bikes */}
                    <div
                        className="metric-card"
                        onClick={() => navigate("/owner/bikes")}
                    >
                        <div className="metric-icon blue">
                            <Bike size={24} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Total Bikes</span>
                            <strong className="metric-value">
                                {loading ? "..." : stats.totalBikes}
                            </strong>
                            <span className="metric-sub">Registered in fleet</span>
                        </div>
                    </div>

                    {/* 2. Total Booking Requests */}
                    <div
                        className="metric-card"
                        onClick={() => navigate("/owner/bookings")}
                    >
                        <div className="metric-icon purple">
                            <CalendarDays size={24} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Total Booking Requests</span>
                            <strong className="metric-value">
                                {loading ? "..." : stats.totalRequests}
                            </strong>
                            <span className="metric-sub">All received inquiries</span>
                        </div>
                    </div>

                    {/* 3. Confirmed Bookings */}
                    <div
                        className="metric-card"
                        onClick={() => navigate("/owner/bookings")}
                    >
                        <div className="metric-icon green">
                            <CheckCircle2 size={24} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Confirmed Bookings</span>
                            <strong className="metric-value">
                                {loading ? "..." : stats.confirmedBookings}
                            </strong>
                            <span className="metric-sub">Accepted reservations</span>
                        </div>
                    </div>

                    {/* 4. Total Earnings */}
                    <div
                        className="metric-card"
                        onClick={() => navigate("/owner/earnings")}
                    >
                        <div className="metric-icon orange">
                            <IndianRupee size={24} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Total Earnings</span>
                            <strong className="metric-value">
                                ₹{loading ? "..." : stats.totalEarnings.toLocaleString()}
                            </strong>
                            <span className="metric-sub">Confirmed & completed</span>
                        </div>
                    </div>

                    {/* 5. Pending Requests */}
                    <div
                        className="metric-card highlight-pending"
                        onClick={() => navigate("/owner/booking-requests")}
                    >
                        <div className="metric-icon amber">
                            <Clock size={24} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Advance Verifications</span>
                            <strong className="metric-value">
                                {loading ? "..." : stats.pendingRequests}
                            </strong>
                            <span className="metric-sub">Awaiting screenshot check</span>
                        </div>
                        {stats.pendingRequests > 0 && (
                            <span className="action-pill">Needs Review</span>
                        )}
                    </div>
                </section>

                {/* ==========================================
                    PENDING BOOKING REQUESTS SECTION
                ========================================== */}
                <section className="dash-section">
                    <div className="dash-section-header">
                        <div>
                            <h2>Advance Payment Verification</h2>
                            <p>Customer reservations awaiting your payment verification</p>
                        </div>
                        <button
                            className="dash-link-btn"
                            onClick={() => navigate("/owner/booking-requests")}
                        >
                            View All Verifications ({stats.pendingRequests}) <ArrowRight size={15} />
                        </button>
                    </div>

                    {recentRequests.length === 0 ? (
                        <div className="dash-empty-box">
                            <div className="dash-empty-icon">
                                <Inbox size={32} />
                            </div>
                            <h3>No pending booking requests</h3>
                            <p>When riders request to rent your bikes, they will appear here for you to accept or reject.</p>
                        </div>
                    ) : (
                        <div className="dash-requests-list">
                            {recentRequests.map((req) => {
                                const bike = req.bikeId || {};
                                const bikeImg = getImageUrl(bike.image);
                                const client = req.userId || {};

                                return (
                                    <div key={req._id} className="dash-request-card">
                                        <div className="req-bike-thumb">
                                            {bikeImg ? (
                                                <img src={bikeImg} alt={bike.bikeName} />
                                            ) : (
                                                <div className="thumb-placeholder">🏍️</div>
                                            )}
                                        </div>

                                        <div className="req-main-info">
                                            <div className="req-header-row">
                                                <h4>{bike.bikeName || "Bike"}</h4>
                                                <span className="status-badge-pending">Pending</span>
                                            </div>
                                            <p className="req-client-info">
                                                Rider: <strong>{req.customerName || client.name || "Customer"}</strong> • {req.customerMobile || client.mobile || client.email || "No phone"}
                                            </p>
                                            <div className="req-dates-row">
                                                <span>📅 {formatDate(req.startDate)} → {formatDate(req.endDate)}</span>
                                                <span className="req-days-tag">{req.totalDays} {req.totalDays === 1 ? "day" : "days"}</span>
                                            </div>
                                        </div>

                                        <div className="req-price-col">
                                            <span className="req-price-label">Total Amount</span>
                                            <strong className="req-price-val">₹{req.totalAmount}</strong>
                                            <small>₹{req.pricePerDay}/day</small>
                                        </div>

                                        <div className="req-actions-col">
                                            <button
                                                className="btn-accept"
                                                onClick={() => handleAcceptRequest(req._id, bike.bikeName)}
                                                disabled={actionLoading === req._id}
                                            >
                                                {actionLoading === req._id ? "Processing..." : "Accept Request"}
                                            </button>
                                            <button
                                                className="btn-reject"
                                                onClick={() => handleRejectRequest(req._id, bike.bikeName)}
                                                disabled={actionLoading === req._id}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ==========================================
                    FLEET OVERVIEW SECTION
                ========================================== */}
                <section className="dash-section">
                    <div className="dash-section-header">
                        <div>
                            <h2>My Listed Fleet</h2>
                            <p>Active bikes in your rental inventory</p>
                        </div>
                        <button
                            className="dash-link-btn"
                            onClick={() => navigate("/owner/bikes")}
                        >
                            Manage All ({ownerBikes.length}) <ArrowRight size={15} />
                        </button>
                    </div>

                    {ownerBikes.length === 0 ? (
                        <div className="dash-empty-box">
                            <div className="dash-empty-icon">
                                <Bike size={32} />
                            </div>
                            <h3>No bikes listed yet</h3>
                            <p>List your first bike to start receiving booking requests and earning on MotoRent.</p>
                            <button
                                className="dash-cta-btn"
                                style={{ marginTop: 12 }}
                                onClick={() => navigate("/owner/bikes/add")}
                            >
                                <Plus size={16} /> Add Your First Bike
                            </button>
                        </div>
                    ) : (
                        <div className="dash-fleet-grid">
                            {ownerBikes.slice(0, 4).map((bike) => {
                                const img = getImageUrl(bike.image);
                                return (
                                    <div key={bike._id} className="dash-fleet-card">
                                        <div className="dash-fleet-img">
                                            {img ? (
                                                <img src={img} alt={bike.bikeName} />
                                            ) : (
                                                <div className="thumb-placeholder">🏍️</div>
                                            )}
                                            <div className="fleet-card-badges">
                                                <span className={`fleet-badge ${bike.status}`}>
                                                    {bike.status}
                                                </span>
                                                <span className={`fleet-approval-badge ${bike.approvalStatus}`}>
                                                    {bike.approvalStatus}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="dash-fleet-body">
                                            <h4>{bike.bikeName}</h4>
                                            <p className="dash-fleet-model">{bike.brand} {bike.model} • {bike.type}</p>
                                            <p className="dash-fleet-loc"><MapPin size={13} /> {bike.location}</p>

                                            <div className="dash-fleet-footer">
                                                <div className="dash-fleet-price">
                                                    <strong>₹{bike.pricePerDay}</strong>
                                                    <span>/day</span>
                                                </div>
                                                <button
                                                    className="dash-edit-btn"
                                                    onClick={() => navigate(`/owner/bikes/edit/${bike._id}`)}
                                                >
                                                    Edit Bike
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </OwnerLayout>
    );
};

export default OwnerDashboard;