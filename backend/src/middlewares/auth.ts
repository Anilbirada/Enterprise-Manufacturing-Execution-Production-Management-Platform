import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { ROLE_PERMISSIONS } from '../config/constants';

export interface AuthenticatedRequest extends Request {
  user?: IUser & { effectivePermissions?: string[] };
  plantId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'rsrfactory360_secure_jwt_secret_key_2026';

export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: 'User account not found.' });
      return;
    }

    if (!user.active) {
      res.status(403).json({ success: false, message: 'User account is deactivated. Contact administrator.' });
      return;
    }

    // Combine role default permissions with custom user permissions
    const defaultRolePerms = ROLE_PERMISSIONS[user.role] || [];
    const customPerms = user.permissions || [];
    const effectivePermissions = Array.from(new Set([...defaultRolePerms, ...customPerms]));

    req.user = Object.assign(user, { effectivePermissions });

    // Scoping plantId
    const plantHeader = req.headers['x-plant-id'] as string;
    if (plantHeader && plantHeader.match(/^[0-9a-fA-F]{24}$/)) {
      req.plantId = plantHeader;
    } else if (user.plantId) {
      req.plantId = user.plantId.toString();
    }

    next();
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired session token.', error: err.message });
  }
};
