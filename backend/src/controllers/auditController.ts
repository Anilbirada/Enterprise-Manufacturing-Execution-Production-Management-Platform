import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { AuditLog } from '../models/AuditLog';

export class AuditController {
  public static async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { action, entity, userId, status, fromDate, toDate } = req.query;
      const filter: any = {};

      if (req.plantId) filter.plantId = req.plantId;
      if (action) filter.action = action;
      if (entity) filter.entity = entity;
      if (userId) filter.userId = userId;
      if (status) filter.status = status;

      if (fromDate || toDate) {
        filter.timestamp = {};
        if (fromDate) filter.timestamp.$gte = new Date(fromDate as string);
        if (toDate) filter.timestamp.$lte = new Date(toDate as string);
      }

      const logs = await AuditLog.find(filter)
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
        .limit(200);

      res.json({ success: true, count: logs.length, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
