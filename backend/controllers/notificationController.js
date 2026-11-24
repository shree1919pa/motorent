const notificationService = require("../services/notificationService");

// ==========================================
// GET USER NOTIFICATIONS
// ==========================================
const getNotifications = async (req, res) => {
    try {
        const data = await notificationService.getUserNotifications(req.user.id);
        res.status(200).json({
            success: true,
            notifications: data.notifications,
            unreadCount: data.unreadCount
        });
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// MARK NOTIFICATION AS READ
// ==========================================
const markAsRead = async (req, res) => {
    try {
        const notification = await notificationService.markAsRead(req.params.id, req.user.id);
        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });
    } catch (error) {
        console.error("Mark Notification Read Error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// ==========================================
const markAllAsRead = async (req, res) => {
    try {
        await notificationService.markAllAsRead(req.user.id);
        res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });
    } catch (error) {
        console.error("Mark All Read Error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead
};
