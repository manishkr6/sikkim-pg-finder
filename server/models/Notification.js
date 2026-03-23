import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'ADD_PG',
        'UPDATE_PG',
        'DELETE_PG',
        'REPORT_PG',
        'USER_SIGNUP',
        'OWNER_REQUEST',
        'OWNER_APPROVED',
        'PG_STATUS_UPDATE',
      ],
      required: [true, 'Notification type is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    isAdminNotification: {
      type: Boolean,
      default: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
