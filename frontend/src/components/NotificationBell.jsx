import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bell,
    CheckCircle,
    XCircle,
    Calendar,
    Info,
    CheckCheck,
    X,
    ExternalLink,
    AlertTriangle
} from "lucide-react";
import useAuth from "../context/useAuth";
import notificationService from "../services/notificationService";
import "./NotificationBell.css";

const NotificationBell = ({ onNotificationClick }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("motorent_token");
            if (!token) return;
            const data = await notificationService.getNotifications();
            if (data && data.success) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (err) {
            // Silently ignore polling errors
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleMarkAsRead = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            await notificationService.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark notification read:", err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            setLoading(true);
            await notificationService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case "booking_confirmed":
                return <CheckCircle size={18} className="notif-icon-confirmed" />;
            case "booking_rejected":
                return <XCircle size={18} className="notif-icon-rejected" />;
            case "booking_request":
                return <Calendar size={18} className="notif-icon-request" />;
            case "booking_cancelled":
                return <AlertTriangle size={18} className="notif-icon-cancelled" />;
            default:
                return <Info size={18} className="notif-icon-info" />;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button
                className={`notification-bell-btn ${unreadCount > 0 ? "has-unread" : ""}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <div className="notification-title">
                            <h3>Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="notification-counter">{unreadCount} new</span>
                            )}
                        </div>
                        <div className="notification-header-actions">
                            {unreadCount > 0 && (
                                <button
                                    className="mark-all-read-btn"
                                    onClick={handleMarkAllRead}
                                    disabled={loading}
                                    title="Mark all as read"
                                >
                                    <CheckCheck size={15} /> Mark read
                                </button>
                            )}
                            <button
                                className="close-notif-btn"
                                onClick={() => setIsOpen(false)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">
                                <div className="no-notif-icon">🔔</div>
                                <p>No notifications yet</p>
                                <span>You will be notified about booking requests & confirmations here.</span>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const isUrgent = notif.priority === "urgent" || notif.type === "booking_cancelled";
                                const bookingId = notif.bookingId?._id || notif.bookingId;

                                return (
                                    <div
                                        key={notif._id}
                                        className={`notification-item ${!notif.isRead ? "unread" : ""} ${isUrgent ? "priority-urgent" : ""}`}
                                        onClick={() => {
                                            if (!notif.isRead) handleMarkAsRead(notif._id);
                                            setIsOpen(false);
                                            if (onNotificationClick) {
                                                onNotificationClick(notif);
                                            } else if (user?.role === "owner") {
                                                if (notif.type === "booking_cancelled") {
                                                    navigate(bookingId ? `/owner/bookings?tab=cancelled&bookingId=${bookingId}` : "/owner/bookings?tab=cancelled");
                                                } else if (notif.type === "booking_request") {
                                                    navigate("/owner/booking-requests");
                                                } else {
                                                    navigate("/owner/bookings");
                                                }
                                            } else {
                                                navigate("/bookings");
                                            }
                                        }}
                                    >
                                        <div className="notification-item-icon">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="notification-item-content">
                                            <div className="notification-item-top">
                                                <div className="notification-title-wrap">
                                                    {isUrgent && <span className="notif-priority-tag">URGENT</span>}
                                                    <strong>{notif.title}</strong>
                                                </div>
                                                <span className="notif-time">
                                                    {formatDate(notif.createdAt)}
                                                </span>
                                            </div>
                                            <p>{notif.message}</p>
                                            <span className="notif-view-action">
                                                View Booking →
                                            </span>
                                        </div>
                                        {!notif.isRead && (
                                            <div
                                                className="unread-dot"
                                                title="Click to mark read"
                                                onClick={(e) => handleMarkAsRead(notif._id, e)}
                                            ></div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
