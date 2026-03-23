import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification.js';

// @desc   Get all notifications (paginated + filtered)
// @route  GET /api/notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const { type, isRead, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (req.user.role === 'admin') {
    filter.isAdminNotification = true;
  } else {
    filter.isAdminNotification = false;
    filter.userId = req.user._id;
  }
  if (type && type !== 'ALL') filter.type = type;
  if (isRead !== undefined) filter.isRead = isRead === 'true';

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'name email'),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  res.json({
    success: true,
    count: notifications.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    unreadCount,
    data: notifications,
  });
});

// @desc   Mark all notifications as read
// @route  PUT /api/notifications/mark-read
export const markAllRead = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === 'admin'
      ? { isRead: false, isAdminNotification: true }
      : { isRead: false, isAdminNotification: false, userId: req.user._id };
  await Notification.updateMany(filter, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

// @desc   Mark single notification as read
// @route  PUT /api/notifications/:id/read
export const markOneRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  if (req.user.role !== 'admin' && String(notification.userId) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to modify this notification');
  }

  notification.isRead = true;
  await notification.save();

  res.json({ success: true, data: notification });
});

// @desc   Get unread notification count
// @route  GET /api/notifications/unread-count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === 'admin'
      ? { isRead: false, isAdminNotification: true }
      : { isRead: false, isAdminNotification: false, userId: req.user._id };
  const count = await Notification.countDocuments(filter);
  res.json({ success: true, count });
});
