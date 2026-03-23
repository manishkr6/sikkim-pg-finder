import asyncHandler from 'express-async-handler';
import PG from '../models/PG.js';
import Review from '../models/Review.js';

// @desc   Get all approved PGs with filters & pagination
// @route  GET /api/pgs
export const getApprovedPGs = asyncHandler(async (req, res) => {
  const {
    city, minPrice, maxPrice, roomType, gender,
    amenities, page = 1, limit = 9, sort = 'newest',
  } = req.query;

  const filter = { status: 'approved', isDeleted: false };

  if (city) filter['location.city'] = { $regex: city, $options: 'i' };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (roomType) filter.roomType = roomType;
  if (gender) filter.genderPreference = gender;
  if (amenities) {
    const amenityList = amenities.split(',').map((a) => a.trim());
    filter.amenities = { $all: amenityList };
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    price_low: { price: 1 },
    price_high: { price: -1 },
    rating: { averageRating: -1 },
  };
  const sortBy = sortOptions[sort] || sortOptions.newest;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [pgs, total] = await Promise.all([
    PG.find(filter)
      .sort(sortBy)
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

// @desc   Get single PG by ID
// @route  GET /api/pgs/:id
export const getPGById = asyncHandler(async (req, res) => {
  const pg = await PG.findOne({ _id: req.params.id, isDeleted: false })
    .populate('owner', 'name email contactNumber');

  if (!pg) {
    res.status(404);
    throw new Error('PG not found');
  }

  const reviews = await Review.find({ pg: pg._id })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: { ...pg.toObject(), reviews } });
});
