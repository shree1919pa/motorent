const notificationRepository = require("../repositories/notificationRepository");

const createNotification = async (data) => {
    return await notificationRepository.createNotification(data);
};

const getUserNotifications = async (userId) => {
    const [notifications, unreadCount] = await Promise.all([
        notificationRepository.getNotificationsByUserId(userId),
        notificationRepository.getUnreadCount(userId)
    ]);

    return {
        notifications,
        unreadCount
    };
};

const markAsRead = async (id, userId) => {
    const notification = await notificationRepository.markAsRead(id, userId);
    if (!notification) {
        throw new Error("Notification not found or access denied");
    }
    return notification;
};

const markAllAsRead = async (userId) => {
    return await notificationRepository.markAllAsRead(userId);
};

module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead
};
