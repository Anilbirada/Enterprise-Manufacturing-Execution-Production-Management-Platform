import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Plant } from '../models/PlantHierarchy';
import { UserRole, ROLE_PERMISSIONS } from '../config/constants';
import { logAudit } from '../middlewares/audit';
import { AuthenticatedRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'rsrfactory360_secure_jwt_secret_key_2026';

export class AuthController {
  /**
   * First Administrator Setup
   * Only allowed if no admin user exists in the database
   */
  public static async setupFirstAdmin(req: Request, res: Response): Promise<void> {
    try {
      const adminCount = await User.countDocuments({ role: UserRole.SYSTEM_ADMIN });
      if (adminCount > 0) {
        res.status(403).json({
          success: false,
          message: 'First administrator already configured. Please log in with existing administrator credentials.'
        });
        return;
      }

      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        res.status(400).json({ success: false, message: 'Email, password, and name are required.' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const adminUser = await User.create({
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: UserRole.SYSTEM_ADMIN,
        active: true,
        permissions: ['*']
      });

      const token = jwt.sign(
        { id: adminUser._id, email: adminUser.email, role: adminUser.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'System Administrator created successfully.',
        token,
        user: {
          id: adminUser._id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          permissions: ['*']
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Check if first admin setup is needed
   */
  public static async checkSetupStatus(req: Request, res: Response): Promise<void> {
    try {
      const adminCount = await User.countDocuments({ role: UserRole.SYSTEM_ADMIN });
      res.json({
        success: true,
        setupRequired: adminCount === 0
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * User Login
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required.' });
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      if (!user.active) {
        res.status(403).json({ success: false, message: 'Your account is inactive. Please contact your manager.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      user.lastLogin = new Date();
      await user.save();

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, plantId: user.plantId },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const defaultRolePerms = ROLE_PERMISSIONS[user.role] || [];
      const effectivePermissions = Array.from(new Set([...defaultRolePerms, ...(user.permissions || [])]));

      let plant = null;
      if (user.plantId) {
        plant = await Plant.findById(user.plantId);
      }

      await logAudit(
        { user, ip: req.ip, get: () => req.get('user-agent') } as any,
        'USER_LOGIN',
        'User',
        user._id.toString()
      );

      res.json({
        success: true,
        message: 'Login successful.',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          plantId: user.plantId,
          plantName: plant?.name,
          permissions: effectivePermissions
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get Current Authenticated User Profile
   */
  public static async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Not authenticated.' });
        return;
      }

      let plant = null;
      if (user.plantId) {
        plant = await Plant.findById(user.plantId);
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          plantId: user.plantId,
          plantName: plant?.name,
          permissions: user.effectivePermissions
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
