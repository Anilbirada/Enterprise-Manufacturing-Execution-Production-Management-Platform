import { AuthenticatedRequest } from './auth';
import { AuditLog } from '../models/AuditLog';

export const logAudit = async (
  req: AuthenticatedRequest,
  action: string,
  entity: string,
  entityId?: string,
  previousValue?: any,
  newValue?: any
): Promise<void> => {
  try {
    await AuditLog.create({
      plantId: req.user?.plantId || req.plantId,
      userId: req.user?._id,
      userEmail: req.user?.email || 'SYSTEM',
      userName: req.user?.name || 'System Operator',
      action,
      entity,
      entityId,
      previousValue,
      newValue,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'SUCCESS'
    });
  } catch (err: any) {
    console.error('[Audit Log Error]', err.message);
  }
};
