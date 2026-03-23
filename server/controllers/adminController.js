import asyncHandler from 'express-async-handler';
import PG from '../models/PG.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import OwnerRequest from '../models/OwnerRequest.js';
import cloudinary from '../config/cloudinary.js';
import { createNotification } from '../utils/notificationHelper.js';
import { emitToUser } from '../utils/notificationHelper.js';

// @desc   Get admin stats
// @route  GET /api/admin/stats
export const getStats = asyncHandler(async (req, res) => {
  const [totalPGs, pendingPGs, totalUsers, totalOwners, unreadNotifs] = await Promise.all([
    PG.countDocuments({ isDeleted: false }),
    PG.countDocuments({ status: { $in: ['pending', 'pending_update'] }, isDeleted: false }),
    User.countDocuments(),
    User.countDocuments({ role: 'owner' }),
    Notification.countDocuments({ isRead: false, isAdminNotification: true }),
  ]);

  res.json({
    success: true,
    data: { totalPGs, pendingPGs, totalUsers, totalOwners, unreadNotifs },
  });
});

// @desc   Get all PGs (admin view)
// @route  GET /api/admin/pgs
export const getAllPGs = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status === 'deleted') {
    filter.isDeleted = true;
  } else {
    if (status) filter.status = status;
  }
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { 'location.city': { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [pgs, total] = await Promise.all([
    PG.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('owner', 'name email'),
    PG.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: pgs.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: pgs,
  });
});

// @desc   Approve a PG
// @route  PUT /api/admin/pgs/:id/approve
export const approvePG = asyncHandler(async (req, res) => {
  const pg = await PG.findById(req.params.id).populate('owner', 'name');
  if (!pg) {
    res.status(404);
    throw new Error('PG not found');
  }

  pg.status = 'approved';
  pg.rejectionReason = '';
  await pg.save();

  // Notify owner
  emitToUser(pg.owner._id.toString(), 'pg_status_update', {
    pgId: pg._id,
    title: pg.title,
    status: 'approved',
    message: `Your PG "${pg.title}" has been approved!`,
  });

  await createNotification(
    `Your PG "${pg.title}" has been approved.`,
    'PG_STATUS_UPDATE',
    pg.owner._id,
    pg._id,
    { isAdminNotification: false }
  );

  const savedByUsers = await User.find({ savedPGs: pg._id }).select('_id');
  await Promise.all(
    savedByUsers.map((u) =>
      createNotification(
        `A PG in your saved list was approved: "${pg.title}".`,
        'PG_STATUS_UPDATE',
        u._id,
        pg._id,
        { isAdminNotification: false }
      )
    )
  );

  res.json({ success: true, message: 'PG approved successfully', data: pg });
});

// @desc   Reject a PG
// @route  PUT /api/admin/pgs/:id/reject
export const rejectPG = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || reason.trim().length < 5) {
    res.status(400);
    throw new Error('Rejection reason is required (min 5 characters)');
  }

  const pg = await PG.findById(req.params.id).populate('owner', 'name');
  if (!pg) {
    res.status(404);
    throw new Error('PG not found');
  }

  pg.status = 'rejected';
  pg.rejectionReason = reason.trim();
  await pg.save();

  // Notify owner
  emitToUser(pg.owner._id.toString(), 'pg_status_update', {
    pgId: pg._id,
    title: pg.title,
    status: 'rejected',
    rejectionReason: reason,
    message: `Your PG "${pg.title}" was rejected: ${reason}`,
  });

  await createNotification(
    `Your PG "${pg.title}" was rejected. Reason: ${reason}`,
    'PG_STATUS_UPDATE',
    pg.owner._id,
    pg._id,
    { isAdminNotification: false }
  );

  const savedByUsers = await User.find({ savedPGs: pg._id }).select('_id');
  await Promise.all(
    savedByUsers.map((u) =>
      createNotification(
        `A PG in your saved list was rejected: "${pg.title}".`,
        'PG_STATUS_UPDATE',
        u._id,
        pg._id,
        { isAdminNotification: false }
      )
    )
  );

  res.json({ success: true, message: 'PG rejected', data: pg });
});

// @desc   Force delete a PG (hard delete)
// @route  DELETE /api/admin/pgs/:id
export const forceDeletePG = asyncHandler(async (req, res) => {
  const pg = await PG.findById(req.params.id);
  if (!pg) {
    res.status(404);
    throw new Error('PG not found');
  }

  // Delete images from Cloudinary
  for (const imgUrl of pg.images) {
    const parts = imgUrl.split('/');
    const publicId = `sikkimpg/pgs/${parts[parts.length - 1].split('.')[0]}`;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('Cloudinary cleanup error:', err.message);
    }
  }

  // Delete associated reviews and reports
  await Promise.all([
    Review.deleteMany({ pg: pg._id }),
    Report.deleteMany({ pg: pg._id }),
    pg.deleteOne(),
  ]);

  res.json({ success: true, message: 'PG permanently deleted' });
});

// @desc   Get all users
// @route  GET /api/admin/users
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);

  const userIds = users.map((u) => u._id);
  const ownerRequests = await OwnerRequest.find({ user: { $in: userIds } })
    .sort({ createdAt: -1 })
    .select('user phoneSnapshot propertyDocumentUrl identityDocumentUrl status createdAt');

  const latestRequestByUser = new Map();
  for (const reqItem of ownerRequests) {
    const key = reqItem.user?.toString();
    if (!key || latestRequestByUser.has(key)) continue;
    latestRequestByUser.set(key, reqItem);
  }

  const usersWithRequestDetails = users.map((u) => {
    const reqItem = latestRequestByUser.get(u._id.toString());
    const plain = u.toObject();
    plain.ownerRequestDetails = reqItem
      ? {
          id: reqItem._id,
          phoneNumber: reqItem.phoneSnapshot,
          propertyDocumentUrl: reqItem.propertyDocumentUrl,
          identityDocumentUrl: reqItem.identityDocumentUrl,
          status: reqItem.status,
          requestedAt: reqItem.createdAt,
        }
      : null;
    return plain;
  });

  res.json({
    success: true,
    count: usersWithRequestDetails.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: usersWithRequestDetails,
  });
});

// @desc   Approve owner request
// @route  PUT /api/admin/users/:id/approve-owner
export const approveOwner = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const pendingOwnerRequest = await OwnerRequest.findOne({ user: user._id, status: 'pending' }).sort({ createdAt: -1 });
  if (!pendingOwnerRequest) {
    res.status(400);
    throw new Error('No pending owner request documents found for this user');
  }

  user.role = 'owner';
  user.ownerRequestStatus = 'approved';
  await user.save();

  pendingOwnerRequest.status = 'approved';
  pendingOwnerRequest.reviewedBy = req.user._id;
  pendingOwnerRequest.reviewedAt = new Date();
  await pendingOwnerRequest.save();

  // Notify user
  emitToUser(user._id.toString(), 'owner_approved', {
    message: 'Congratulations! Your owner access request has been approved.',
  });

  await createNotification(
    'Your owner access request has been approved. You can now list PGs.',
    'OWNER_APPROVED',
    user._id,
    pendingOwnerRequest._id,
    { isAdminNotification: false }
  );

  res.json({ success: true, message: 'Owner access approved', data: user });
});

// @desc   Block or unblock user
// @route  PUT /api/admin/users/:id/block
export const toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    res.status(403);
    throw new Error('Cannot block admin accounts');
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  res.json({
    success: true,
    message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
    data: { id: user._id, name: user.name, isBlocked: user.isBlocked },
  });
});

// @desc   Get all reports
// @route  GET /api/admin/reports
export const getReports = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};

  const reports = await Report.find(filter)
    .populate('pg', 'title location')
    .populate('reportedBy', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: reports.length, data: reports });
});

// @desc   Update report status
// @route  PUT /api/admin/reports/:id
export const updateReport = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'reviewed', 'dismissed'];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error('Invalid status value');
  }

  const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true })
    .populate('pg', 'title')
    .populate('reportedBy', 'name email');

  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }

  res.json({ success: true, data: report });
});
