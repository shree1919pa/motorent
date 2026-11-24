import { useEffect, useState } from "react";
import {
    Wallet,
    IndianRupee,
    CheckCircle2,
    CheckCheck,
    TrendingUp,
    Calendar,
    Download
} from "lucide-react";
import bookingService from "../../services/bookingService";
import OwnerLayout from "../../components/owner/OwnerLayout";
import "./OwnerEarnings.css";

const OwnerEarnings = () => {
    const [earningsData, setEarningsData] = useState({
        totalEarnings: 0,
        confirmedEarnings: 0,
        completedEarnings: 0,
        completedBookings: 0,
        history: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                setLoading(true);
                const data = await bookingService.getOwnerEarnings();
                if (data && data.earnings) {
                    setEarningsData(data.earnings);
                }
            } catch (err) {
                console.error("Fetch Owner Earnings Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchEarnings();
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const historyItems = earningsData.history || [];

    return (
        <OwnerLayout activePage="earnings">
            <div className="owner-earnings-page">
                {/* PAGE HEADER */}
                <div className="earnings-page-header">
                    <div>
                        <span className="owner-role-tag">FINANCIAL OVERVIEW</span>
                        <h1>Earnings & Payouts</h1>
                        <p>Track your rental revenues from confirmed bookings and completed trips.</p>
                    </div>

                    <div className="earnings-hero-badge">
                        <Wallet size={20} />
                        <div>
                            <small>Total Revenue</small>
                            <strong>₹{loading ? "..." : earningsData.totalEarnings.toLocaleString()}</strong>
                        </div>
                    </div>
                </div>

                {/* 4 EARNINGS METRIC CARDS */}
                <section className="earnings-metrics-grid">
                    {/* 1. Total Earnings */}
                    <div className="earnings-card total">
                        <div className="earnings-icon blue">
                            <IndianRupee size={24} />
                        </div>
                        <div className="earnings-card-body">
                            <span className="earnings-card-label">Total Earnings</span>
                            <strong className="earnings-card-val">
                                ₹{loading ? "..." : earningsData.totalEarnings.toLocaleString()}
                            </strong>
                            <span className="earnings-card-sub">All active & completed revenue</span>
                        </div>
                    </div>

                    {/* 2. Confirmed Earnings */}
                    <div className="earnings-card confirmed">
                        <div className="earnings-icon green">
                            <CheckCircle2 size={24} />
                        </div>
                        <div className="earnings-card-body">
                            <span className="earnings-card-label">Confirmed Earnings</span>
                            <strong className="earnings-card-val">
                                ₹{loading ? "..." : earningsData.confirmedEarnings.toLocaleString()}
                            </strong>
                            <span className="earnings-card-sub">Reserved upcoming rentals</span>
                        </div>
                    </div>

                    {/* 3. Completed Rental Earnings */}
                    <div className="earnings-card completed">
                        <div className="earnings-icon purple">
                            <CheckCheck size={24} />
                        </div>
                        <div className="earnings-card-body">
                            <span className="earnings-card-label">Completed Rental Earnings</span>
                            <strong className="earnings-card-val">
                                ₹{loading ? "..." : earningsData.completedEarnings.toLocaleString()}
                            </strong>
                            <span className="earnings-card-sub">Fully fulfilled trips</span>
                        </div>
                    </div>

                    {/* 4. Number of Completed Rentals */}
                    <div className="earnings-card count">
                        <div className="earnings-icon orange">
                            <TrendingUp size={24} />
                        </div>
                        <div className="earnings-card-body">
                            <span className="earnings-card-label">Completed Rentals</span>
                            <strong className="earnings-card-val">
                                {loading ? "..." : earningsData.completedBookings}
                            </strong>
                            <span className="earnings-card-sub">Total trips completed</span>
                        </div>
                    </div>
                </section>

                {/* EARNINGS HISTORY TABLE */}
                <section className="earnings-history-section">
                    <div className="history-section-header">
                        <div>
                            <h2>Earnings History</h2>
                            <p>Detailed breakdown of confirmed and completed rental transactions</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="earnings-loading-box">
                            <div className="spinner"></div>
                            <p>Loading revenue records...</p>
                        </div>
                    ) : historyItems.length === 0 ? (
                        <div className="earnings-empty-box">
                            <div className="empty-wallet-icon">
                                <Wallet size={40} />
                            </div>
                            <h3>No earnings records yet</h3>
                            <p>
                                Revenue will start recording once you accept customer booking requests and complete rentals.
                            </p>
                        </div>
                    ) : (
                        <div className="earnings-table-wrapper">
                            <table className="earnings-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Bike</th>
                                        <th>Client</th>
                                        <th>Booking ID</th>
                                        <th>Rental Period</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyItems.map((item) => {
                                        const bike = item.bikeId || {};
                                        const client = item.userId || {};

                                        return (
                                            <tr key={item._id}>
                                                {/* DATE */}
                                                <td>
                                                    <span className="earning-date">
                                                        {formatDate(item.createdAt || item.bookingDate)}
                                                    </span>
                                                </td>

                                                {/* BIKE */}
                                                <td>
                                                    <div className="earning-bike">
                                                        <strong>{bike.bikeName || "Rental Bike"}</strong>
                                                        <small>{bike.brand} {bike.model}</small>
                                                    </div>
                                                </td>

                                                {/* CLIENT */}
                                                <td>
                                                    <div className="earning-client">
                                                        <strong>{item.customerName || client.name || "Client"}</strong>
                                                        <small>{client.email}</small>
                                                    </div>
                                                </td>

                                                {/* BOOKING ID */}
                                                <td>
                                                    <code className="booking-id-tag">
                                                        #{item._id.slice(-6).toUpperCase()}
                                                    </code>
                                                </td>

                                                {/* RENTAL PERIOD */}
                                                <td>
                                                    <div className="earning-period">
                                                        <span>{formatDate(item.startDate)} - {formatDate(item.endDate)}</span>
                                                        <small>({item.totalDays} {item.totalDays === 1 ? "day" : "days"})</small>
                                                    </div>
                                                </td>

                                                {/* AMOUNT */}
                                                <td>
                                                    <strong className="earning-amount">
                                                        +₹{item.totalAmount}
                                                    </strong>
                                                </td>

                                                {/* STATUS */}
                                                <td>
                                                    <span className={`earning-status-pill ${item.status}`}>
                                                        {item.status === "confirmed" ? "Confirmed" : "Completed"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </OwnerLayout>
    );
};

export default OwnerEarnings;
