import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Notification } from '../models/Notification';

export class NotificationController {
  public static async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = {};
      if (req.user) {
        filter.$or = [
          { recipientId: req.user._id },
          { targetRole: req.user.role },
          { targetRole: { $exists: false } },
          { targetRole: null }
        ];
      }
      if (req.plantId) {
        filter.plantId = req.plantId;
      }

      const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
      const unreadCount = notifications.filter((n) => !n.isRead).length;

      res.json({ success: true, count: notifications.length, unreadCount, notifications });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async markRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await Notification.findByIdAndUpdate(
        id,
        { isRead: true, readAt: new Date() },
        { new: true }
      );
      res.json({ success: true, notification });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async markAllRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = {};
      if (req.user) {
        filter.$or = [{ recipientId: req.user._id }, { targetRole: req.user.role }];
      }
      await Notification.updateMany(filter, { isRead: true, readAt: new Date() });
      res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
