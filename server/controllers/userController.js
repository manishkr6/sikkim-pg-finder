import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import PG from '../models/PG.js';
import OwnerRequest from '../models/OwnerRequest.js';
import { createNotification } from '../utils/notificationHelper.js';

// @desc   Toggle save/unsave a PG
// @route  POST /api/user/save/:pgId
export const toggleSavePG = asyncHandler(async (req, res) => {
  const pg = await PG.findById(req.params.pgId);
  if (!pg || pg.isDeleted) {
    res.status(404);
    throw new Error('PG not found');
  }
  if (pg.status !== 'approved') {
    res.status(400);
    throw new Error('Can only save approved PGs');
  }

  const user = await User.findById(req.user._id);
  const pgId = pg._id;
  const alreadySaved = user.savedPGs.some((id) => id.toString() === pgId.toString());

  if (alreadySaved) {
    user.savedPGs = user.savedPGs.filter((id) => id.toString() !== pgId.toString());
  } else {
    user.savedPGs.push(pgId);
  }

  await user.save();

  res.json({
    success: true,
    saved: !alreadySaved,
    message: alreadySaved ? 'PG removed from saved' : 'PG saved successfully',
  });
});

// @desc   Get saved PGs
// @route  GET /api/user/saved
export const getSavedPGs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'savedPGs',
    match: { isDeleted: false, status: 'approved' },
    populate: { path: 'owner', select: 'name' },
  });

  res.json({ success: true, count: user.savedPGs.length, data: user.savedPGs });
});

// @desc   Request owner access
// @route  POST /api/user/request-owner
export const requestOwner = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { fullName, phoneNumber } = req.body;
  const propertyDocument = req.files?.propertyDocument?.[0];
  const identityDocument = req.files?.identityDocument?.[0];

  if (user.role === 'owner' || user.role === 'admin') {
    res.status(400);
    throw new Error('You already have owner or admin privileges');
  }

  if (!fullName || String(fullName).trim().length < 2) {
    res.status(400);
    throw new Error('Valid full name is required');
  }
  if (!phoneNumber || String(phoneNumber).trim().length < 8) {
    res.status(400);
    throw new Error('Valid phone number is required');
  }
  if (!propertyDocument || !identityDocument) {
    res.status(400);
    throw new Error('Both property document and identity document are required');
  }

  const existingPending = await OwnerRequest.findOne({ user: user._id, status: 'pending' });
  if (existingPending || user.ownerRequestStatus === 'pending') {
    res.status(400);
    throw new Error('Your owner request is already pending review');
  }

  await OwnerRequest.create({
    user: user._id,
    nameSnapshot: String(fullName).trim(),
    emailSnapshot: user.email,
    phoneSnapshot: String(phoneNumber).trim(),
    propertyDocumentUrl: propertyDocument.path,
    identityDocumentUrl: identityDocument.path,
    status: 'pending',
  });

  user.ownerRequestStatus = 'pending';
  await user.save();

  await createNotification(
    `Owner access requested by ${user.name} (${user.email})`,
    'OWNER_REQUEST',
    user._id,
    user._id
  );

  res.json({ success: true, message: 'Owner request submitted successfully' });
});

// @desc   Update profile name
// @route  PUT /api/user/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) {
    res.status(400);
    throw new Error('Name must be at least 2 characters');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name: name.trim() },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({ success: true, message: 'Profile updated', data: user });
});

// @desc   Change password
// @route  PUT /api/user/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Both current and new password are required');
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
});
