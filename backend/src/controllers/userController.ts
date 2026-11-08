import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logAudit } from '../middlewares/audit';

export class UserController {
  public static async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = {};
      if (req.plantId) {
        filter.$or = [{ plantId: req.plantId }, { plantId: null }];
      }

      const users = await User.find(filter).select('-passwordHash').populate('plantId', 'name code location').sort({ createdAt: -1 });
      res.json({ success: true, count: users.length, users });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, name, role, plantId, permissions } = req.body;
      if (!email || !password || !name || !role) {
        res.status(400).json({ success: false, message: 'Email, password, name and role are required.' });
        return;
      }

      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        res.status(409).json({ success: false, message: 'User with this email already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        email: email.toLowerCase(),
        passwordHash,
        name,
        role,
        plantId: plantId || req.plantId,
        permissions: permissions || [],
        active: true
      });

      await logAudit(req, 'CREATE_USER', 'User', user._id.toString(), undefined, { email: user.email, role: user.role });

      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          plantId: user.plantId,
          active: user.active
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, role, plantId, active, permissions, password } = req.body;

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      const previousValue = { name: user.name, role: user.role, active: user.active };

      if (name) user.name = name;
      if (role) user.role = role;
      if (plantId !== undefined) user.plantId = plantId;
      if (active !== undefined) user.active = active;
      if (permissions) user.permissions = permissions;
      if (password && password.length >= 8) {
        user.passwordHash = await bcrypt.hash(password, 10);
      }

      await user.save();
      await logAudit(req, 'UPDATE_USER', 'User', user._id.toString(), previousValue, { name: user.name, role: user.role, active: user.active });

      res.json({ success: true, message: 'User updated successfully.', user });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
