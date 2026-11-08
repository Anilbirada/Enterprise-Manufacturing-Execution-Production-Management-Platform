import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { UserRole } from '../config/constants';
import { AuditLog } from '../models/AuditLog';

export const requirePermission = (...requiredPermissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    // System Administrator has wildcard access
    if (user.role === UserRole.SYSTEM_ADMIN) {
      next();
      return;
    }

    const effective = user.effectivePermissions || [];
    const hasPerm = requiredPermissions.some(
      (perm) => effective.includes(perm) || effective.includes('*')
    );

    if (!hasPerm) {
      // Record access denied in AuditLog
      try {
        await AuditLog.create({
          plantId: user.plantId,
          userId: user._id,
          userEmail: user.email,
          userName: user.name,
          action: 'ACCESS_DENIED',
          entity: req.baseUrl + req.path,
          previousValue: { requiredPermissions, method: req.method },
          newValue: { userRole: user.role },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'ACCESS_DENIED'
        });
      } catch (logErr) {
        console.error('Audit log failure for access denied:', logErr);
      }

      res.status(403).json({
        success: false,
        message: `Access denied. Requires one of permissions: ${requiredPermissions.join(', ')}`,
        userRole: user.role
      });
      return;
    }

    next();
  };
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    if (user.role === UserRole.SYSTEM_ADMIN || allowedRoles.includes(user.role)) {
      next();
      return;
    }

    try {
      await AuditLog.create({
        plantId: user.plantId,
        userId: user._id,
        userEmail: user.email,
        userName: user.name,
        action: 'ROLE_ACCESS_DENIED',
        entity: req.baseUrl + req.path,
        previousValue: { allowedRoles },
        newValue: { userRole: user.role },
        ipAddress: req.ip,
        status: 'ACCESS_DENIED'
      });
    } catch {}

    res.status(403).json({
      success: false,
      message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      userRole: user.role
    });
  };
};
