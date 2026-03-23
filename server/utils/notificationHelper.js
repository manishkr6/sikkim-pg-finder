import Notification from '../models/Notification.js';

let _io = null;

export const setIO = (io) => {
  _io = io;
};

export const createNotification = async (message, type, userId = null, relatedId = null, options = {}) => {
  try {
    const isAdminNotification = options.isAdminNotification ?? true;
    const notification = await Notification.create({
      message,
      type,
      ...(userId && { userId }),
      ...(relatedId && { relatedId }),
      isAdminNotification,
      isRead: false,
    });

    if (_io && isAdminNotification) {
      const unreadCount = await Notification.countDocuments({ isRead: false, isAdminNotification: true });
      _io.to('admin_room').emit('new_notification', {
        notification,
        unreadCount,
      });
    } else if (_io && !isAdminNotification && userId) {
      const unreadCount = await Notification.countDocuments({
        isRead: false,
        isAdminNotification: false,
        userId,
      });
      _io.to(`user_${userId}`).emit('new_notification', {
        notification,
        unreadCount,
      });
    }

    return notification;
  } catch (error) {
    console.error('Notification creation failed:', error.message);
    return null;
  }
};

export const emitToUser = (userId, event, payload) => {
  if (_io) {
    _io.to(`user_${userId}`).emit(event, payload);
  }
};
