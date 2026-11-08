import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { MaintenanceOrder } from '../models/MaintenanceOrder';
import { Machine } from '../models/Machine';
import { MaintenanceStatus, MachineState } from '../config/constants';
import { logAudit } from '../middlewares/audit';
import mongoose from 'mongoose';

export class MaintenanceController {
  public static async getMaintenanceOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { machineId, status, type } = req.query;
      const filter: any = {};

      if (req.plantId) filter.plantId = req.plantId;
      if (machineId) filter.machineId = machineId;
      if (status) filter.status = status;
      if (type) filter.type = type;

      const orders = await MaintenanceOrder.find(filter)
        .populate('machineId', 'name code type state productionLineId')
        .populate('assignedTechnicianId', 'name email')
        .populate('spareParts.materialId', 'name code')
        .sort({ scheduledDate: 1 });

      res.json({ success: true, count: orders.length, orders });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createMaintenanceOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        machineId,
        type,
        title,
        description,
        scheduledDate,
        priority,
        assignedTechnicianId
      } = req.body;

      if (!machineId || !title || !description || !scheduledDate) {
        res.status(400).json({
          success: false,
          message: 'machineId, title, description, and scheduledDate are required.'
        });
        return;
      }

      const count = await MaintenanceOrder.countDocuments();
      const orderNumber = `MO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const order = await MaintenanceOrder.create({
        plantId: new mongoose.Types.ObjectId(req.body.plantId || req.plantId),
        orderNumber,
        machineId: new mongoose.Types.ObjectId(machineId),
        type,
        title,
        description,
        scheduledDate: new Date(scheduledDate),
        priority: priority || 'Medium',
        status: MaintenanceStatus.SCHEDULED,
        assignedTechnicianId: assignedTechnicianId ? new mongoose.Types.ObjectId(assignedTechnicianId) : undefined
      });

      await logAudit(req, 'CREATE_MAINTENANCE_ORDER', 'MaintenanceOrder', order._id.toString(), undefined, req.body);

      res.status(201).json({ success: true, message: 'Maintenance order scheduled.', order });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async updateMaintenanceOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, actionsTaken, downtimeDurationMinutes, spareParts, completionDate } = req.body;

      const order = await MaintenanceOrder.findById(id);
      if (!order) {
        res.status(404).json({ success: false, message: 'Maintenance order not found.' });
        return;
      }

      if (status) order.status = status;
      if (actionsTaken) order.actionsTaken = actionsTaken;
      if (downtimeDurationMinutes !== undefined) order.downtimeDurationMinutes = downtimeDurationMinutes;
      if (spareParts) order.spareParts = spareParts;

      if (status === MaintenanceStatus.COMPLETED) {
        order.completionDate = completionDate ? new Date(completionDate) : new Date();

        const machine = await Machine.findById(order.machineId);
        if (machine) {
          machine.lastMaintenanceDate = order.completionDate;
          machine.nextMaintenanceDate = new Date(order.completionDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          if (machine.state === MachineState.MAINTENANCE) {
            machine.state = MachineState.IDLE;
          }
          await machine.save();
        }
      } else if (status === MaintenanceStatus.IN_PROGRESS) {
        order.startDate = new Date();
        const machine = await Machine.findById(order.machineId);
        if (machine) {
          machine.state = MachineState.MAINTENANCE;
          await machine.save();
        }
      }

      await order.save();
      await logAudit(req, 'UPDATE_MAINTENANCE_ORDER', 'MaintenanceOrder', id, undefined, req.body);

      res.json({ success: true, message: 'Maintenance order updated.', order });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
