import mongoose from 'mongoose';
import PG from './PG.js';

const reviewSchema = new mongoose.Schema(
  {
    pg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PG',
      required: [true, 'PG reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      trim: true,
    },
  },
  { timestamps: true }
);

// One review per user per PG
reviewSchema.index({ pg: 1, user: 1 }, { unique: true });

// Helper: recalculate PG rating
const recalcRating = async (pgId) => {
  const stats = await mongoose.model('Review').aggregate([
    { $match: { pg: pgId } },
    { $group: { _id: '$pg', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await PG.findByIdAndUpdate(pgId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].count,
    });
  } else {
    await PG.findByIdAndUpdate(pgId, { averageRating: 0, totalReviews: 0 });
  }
};

reviewSchema.post('save', async function () {
  await recalcRating(this.pg);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await recalcRating(doc.pg);
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
