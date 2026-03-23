import asyncHandler from 'express-async-handler';
import Review from '../models/Review.js';
import PG from '../models/PG.js';

// @desc   Get all reviews for a PG
// @route  GET /api/reviews/:pgId
export const getPGReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ pg: req.params.pgId })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: reviews.length, data: reviews });
});

// @desc   Add review for a PG
// @route  POST /api/reviews/:pgId
export const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }
  if (!comment || comment.trim().length < 10) {
    res.status(400);
    throw new Error('Comment must be at least 10 characters');
  }

  const pg = await PG.findById(req.params.pgId);
  if (!pg || pg.isDeleted) {
    res.status(404);
    throw new Error('PG not found');
  }
  if (pg.status !== 'approved') {
    res.status(400);
    throw new Error('Can only review approved PGs');
  }

  // Check for duplicate review
  const existing = await Review.findOne({ pg: pg._id, user: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('You have already reviewed this PG');
  }

  const review = await Review.create({
    pg: pg._id,
    user: req.user._id,
    rating: Number(rating),
    comment: comment.trim(),
  });

  await review.populate('user', 'name');

  res.status(201).json({ success: true, message: 'Review submitted', data: review });
});

// @desc   Delete a review
// @route  DELETE /api/reviews/:reviewId
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const isOwner = review.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }

  await review.deleteOne();
  res.json({ success: true, message: 'Review deleted' });
});
