import asyncHandler from 'express-async-handler';
import { validationResult } from 'express-validator';
import PG from '../models/PG.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { createNotification, emitToUser } from '../utils/notificationHelper.js';

// @desc   Get all PGs owned by logged in owner
// @route  GET /api/owner/pgs
export const getOwnerPGs = asyncHandler(async (req, res) => {
  const pgs = await PG.find({ owner: req.user._id })
    .sort({ createdAt: -1 });

  res.json({ success: true, count: pgs.length, data: pgs });
});

// @desc   Create new PG
// @route  POST /api/owner/pgs
export const createPG = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  const {
    title, description, price,
    city, area, address,
    roomType, genderPreference,
    amenities, contactNumber,
  } = req.body;

  // Collect uploaded image URLs from Cloudinary
  const images = req.files ? req.files.map((f) => f.path) : [];

  const pg = await PG.create({
    title,
    description,
    price: Number(price),
    location: { city, area, address },
    roomType,
    genderPreference,
    amenities: amenities ? (Array.isArray(amenities) ? amenities : amenities.split(',')) : [],
    images,
    contactNumber,
    owner: req.user._id,
    status: 'pending',
  });

  await createNotification(
    `New PG submitted: ${pg.title} by ${req.user.name}`,
    'ADD_PG',
    req.user._id,
    pg._id
  );

  res.status(201).json({ success: true, message: 'PG submitted for approval', data: pg });
});

// @desc   Update a PG
// @route  PUT /api/owner/pgs/:id
export const updatePG = asyncHandler(async (req, res) => {
  const pg = await PG.findById(req.params.id);

  if (!pg) {
    res.status(404);
    throw new Error('PG not found');
  }

  // Check ownership
  if (pg.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to edit this PG');
  }

  if (pg.isDeleted) {
    res.status(404);
    throw new Error('PG has been deleted');
  }

  const {
    title, description, price,
    city, area, address,
    roomType, genderPreference,
    amenities, contactNumber,
    removeImages,
  } = req.body;

  // Handle image removal from Cloudinary
  if (removeImages) {
    const toRemove = Array.isArray(removeImages) ? removeImages : [removeImages];
    for (const imgUrl of toRemove) {
      // Extract public_id from URL
      const parts = imgUrl.split('/');
      const publicId = `sikkimpg/pgs/${parts[parts.length - 1].split('.')[0]}`;
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Cloudinary delete error:', err.message);
      }
    }
    pg.images = pg.images.filter((img) => !toRemove.includes(img));
  }

  // Add new uploaded images
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((f) => f.path);
    pg.images = [...pg.images, ...newImages].slice(0, 6);
  }

  pg.title = title || pg.title;
  pg.description = description || pg.description;
  pg.price = price ? Number(price) : pg.price;
  pg.location.city = city || pg.location.city;
  pg.location.area = area || pg.location.area;
  pg.location.address = address || pg.location.address;
  pg.roomType = roomType || pg.roomType;
  pg.genderPreference = genderPreference || pg.genderPreference;
  pg.amenities = amenities
    ? Array.isArray(amenities) ? amenities : amenities.split(',')
    : pg.amenities;
  pg.contactNumber = contactNumber || pg.contactNumber;
  pg.status = 'pending_update';

  await pg.save();

  await createNotification(
    `PG updated: "${pg.title}" needs re-approval`,
    'UPDATE_PG',
    req.user._id,
    pg._id
  );

  const savedByUsers = await User.find({ savedPGs: pg._id }).select('_id');
  await Promise.all(
    savedByUsers.map((u) =>
      createNotification(
        `A PG in your saved list was updated: "${pg.title}".`,
        'PG_STATUS_UPDATE',
        u._id,
        pg._id,
        { isAdminNotification: false }
      )
    )
  );

  res.json({ success: true, message: 'PG updated and pending re-approval', data: pg });
});

// @desc   Soft-delete a PG
// @route  DELETE /api/owner/pgs/:id
export const deletePG = asyncHandler(async (req, res) => {
  const pg = await PG.findById(req.params.id);

  if (!pg) {
    res.status(404);
    throw new Error('PG not found');
  }

  if (pg.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this PG');
  }

  pg.isDeleted = true;
  await pg.save();

  await createNotification(
    `PG deleted: "${pg.title}" by ${req.user.name}`,
    'DELETE_PG',
    req.user._id,
    pg._id
  );

  const savedByUsers = await User.find({ savedPGs: pg._id }).select('_id');
  await Promise.all(
    savedByUsers.map((u) =>
      createNotification(
        `A PG in your saved list was deleted: "${pg.title}".`,
        'PG_STATUS_UPDATE',
        u._id,
        pg._id,
        { isAdminNotification: false }
      )
    )
  );

  res.json({ success: true, message: 'PG deleted successfully' });
});
