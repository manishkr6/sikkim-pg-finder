import mongoose from 'mongoose';

const pgSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [50, 'Description must be at least 50 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [500, 'Price must be at least ₹500'],
    },
    location: {
      city: { type: String, required: [true, 'City is required'] },
      area: { type: String, required: [true, 'Area is required'] },
      address: { type: String, required: [true, 'Address is required'] },
    },
    roomType: {
      type: String,
      enum: ['Single', 'Double', 'Triple'],
      required: [true, 'Room type is required'],
    },
    genderPreference: {
      type: String,
      enum: ['Boys', 'Girls', 'Co-ed'],
      required: [true, 'Gender preference is required'],
    },
    amenities: [
      {
        type: String,
        enum: ['WiFi', 'Food', 'AC', 'Parking', 'Laundry', 'CCTV', 'Water', 'Gym'],
      },
    ],
    images: [{ type: String }],
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      match: [/^[+]?[6-9]\d{9}$/, 'Invalid Indian phone number'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'pending_update'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for performance
pgSchema.index({ status: 1, isDeleted: 1 });
pgSchema.index({ 'location.city': 1 });
pgSchema.index({ price: 1 });
pgSchema.index({ owner: 1 });

const PG = mongoose.model('PG', pgSchema);
export default PG;
