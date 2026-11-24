const Notification = require("../models/Notification");

// ==========================================
// CREATE NOTIFICATION
// ==========================================
const createNotification = async (notificationData) => {
    return await Notification.create(notificationData);
};

// ==========================================
// GET USER NOTIFICATIONS
// ==========================================
const getNotificationsByUserId = async (userId, limit = 30) => {
    const list = await Notification.find({ userId })
        .populate("bookingId", "status startDate endDate totalAmount advanceAmount customerName customerMobile bikeId")
        .sort({ createdAt: -1 })
        .limit(limit);

    // Place urgent notifications (e.g. Ride Cancelled) at top of list
    return list.sort((a, b) => {
        const aScore = (a.priority === "urgent" && !a.isRead ? 3 : (a.priority === "urgent" ? 2 : (a.priority === "high" ? 1 : 0)));
        const bScore = (b.priority === "urgent" && !b.isRead ? 3 : (b.priority === "urgent" ? 2 : (b.priority === "high" ? 1 : 0)));
        if (aScore !== bScore) return bScore - aScore;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
};

// ==========================================
// MARK AS READ
// ==========================================
const markAsRead = async (id, userId) => {
    return await Notification.findOneAndUpdate(
        { _id: id, userId },
        { isRead: true },
        { returnDocument: "after" }
    );
};

// ==========================================
// MARK ALL AS READ
// ==========================================
const markAllAsRead = async (userId) => {
    return await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
    );
};

// ==========================================
// GET UNREAD COUNT
// ==========================================
const getUnreadCount = async (userId) => {
    return await Notification.countDocuments({
        userId,
        isRead: false
    });
};

module.exports = {
    createNotification,
    getNotificationsByUserId,
    markAsRead,
    markAllAsRead,
    getUnreadCount
};
