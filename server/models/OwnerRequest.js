import mongoose from 'mongoose';

const ownerRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    nameSnapshot: {
      type: String,
      required: true,
      trim: true,
    },
    emailSnapshot: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phoneSnapshot: {
      type: String,
      required: true,
      trim: true,
    },
    propertyDocumentUrl: {
      type: String,
      required: true,
    },
    identityDocumentUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    reviewRemark: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

const OwnerRequest = mongoose.model('OwnerRequest', ownerRequestSchema);
export default OwnerRequest;
