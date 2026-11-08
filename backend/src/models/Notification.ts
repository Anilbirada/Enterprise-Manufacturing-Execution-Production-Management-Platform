import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  plantId: mongoose.Types.ObjectId;
  recipientId?: mongoose.Types.ObjectId;
  targetRole?: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  category:
    | 'TARGET_MISSED'
    | 'WORK_ORDER_OVERDUE'
    | 'DOWNTIME'
    | 'ANDON_CRITICAL'
    | 'QUALITY_REJECTION'
    | 'MAINTENANCE_DUE'
    | 'QUALITY_HOLD'
    | 'GENERAL';
  relatedEntityId?: mongoose.Types.ObjectId;
  relatedEntityType?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    targetRole: { type: String, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['INFO', 'WARNING', 'CRITICAL', 'SUCCESS'],
      default: 'INFO',
      index: true
    },
    category: {
      type: String,
      enum: [
        'TARGET_MISSED',
        'WORK_ORDER_OVERDUE',
        'DOWNTIME',
        'ANDON_CRITICAL',
        'QUALITY_REJECTION',
        'MAINTENANCE_DUE',
        'QUALITY_HOLD',
        'GENERAL'
      ],
      default: 'GENERAL',
      index: true
    },
    relatedEntityId: { type: Schema.Types.ObjectId },
    relatedEntityType: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date }
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
