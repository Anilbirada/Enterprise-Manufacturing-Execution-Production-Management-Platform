import { Server as SocketIOServer } from 'socket.io';
import { Notification } from '../models/Notification';
import mongoose from 'mongoose';

let ioInstance: SocketIOServer | null = null;

export const setSocketIOInstance = (io: SocketIOServer) => {
  ioInstance = io;
};

export class NotificationAdapter {
  public static async sendNotification(params: {
    plantId: string;
    recipientId?: string;
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
    relatedEntityId?: string;
    relatedEntityType?: string;
  }) {
    // 1. Create DB record
    const notification = await Notification.create({
      plantId: new mongoose.Types.ObjectId(params.plantId),
      recipientId: params.recipientId ? new mongoose.Types.ObjectId(params.recipientId) : undefined,
      targetRole: params.targetRole,
      title: params.title,
      message: params.message,
      type: params.type,
      category: params.category,
      relatedEntityId: params.relatedEntityId ? new mongoose.Types.ObjectId(params.relatedEntityId) : undefined,
      relatedEntityType: params.relatedEntityType
    });

    // 2. Broadcast via Socket.IO
    if (ioInstance) {
      if (params.plantId) {
        ioInstance.to(`plant:${params.plantId}`).emit('notification', notification);
      } else {
        ioInstance.emit('notification', notification);
      }
    }

    return notification;
  }
}
