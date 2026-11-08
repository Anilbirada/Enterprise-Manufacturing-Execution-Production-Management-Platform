import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { DowntimeEvent } from '../models/DowntimeEvent';
import { Machine } from '../models/Machine';
import { MachineState, DowntimeCategory } from '../config/constants';
import { NotificationAdapter } from '../adapters/notificationAdapter';
import { logAudit } from '../middlewares/audit';
import mongoose from 'mongoose';

export class DowntimeController {
  public static async getDowntimeEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { machineId, active, category } = req.query;
      const filter: any = {};

      if (req.plantId) filter.plantId = req.plantId;
      if (machineId) filter.machineId = machineId;
      if (active !== undefined) filter.active = active === 'true';
      if (category) filter.category = category;

      const events = await DowntimeEvent.find(filter)
        .populate('machineId', 'name code productionLineId state')
        .populate('productionLineId', 'name code')
        .populate('reportedBy', 'name email')
        .populate('resolvedBy', 'name email')
        .sort({ startTime: -1 });

      res.json({ success: true, count: events.length, events });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async reportDowntime(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        machineId,
        category,
        reasonDescription,
        reasonCode,
        isPlanned,
        startTime,
        workOrderId
      } = req.body;

      if (!machineId || !category || !reasonDescription) {
        res.status(400).json({ success: false, message: 'Machine ID, category, and reason description are required.' });
        return;
      }

      const machine = await Machine.findById(machineId);
      if (!machine) {
        res.status(404).json({ success: false, message: 'Machine not found.' });
        return;
      }

      const event = await DowntimeEvent.create({
        plantId: machine.plantId,
        machineId: machine._id,
        productionLineId: machine.productionLineId,
        workOrderId: workOrderId || machine.currentWorkOrderId,
        category,
        isPlanned: Boolean(isPlanned),
        reasonCode,
        reasonDescription,
        startTime: startTime ? new Date(startTime) : new Date(),
        reportedBy: req.user?._id || new mongoose.Types.ObjectId(),
        active: true
      });

      machine.state = isPlanned ? MachineState.STOPPED : MachineState.FAULT;
      machine.lastStateChange = new Date();
      await machine.save();

      await NotificationAdapter.sendNotification({
        plantId: machine.plantId.toString(),
        targetRole: 'Shift Supervisor',
        title: `Machine Down: ${machine.name} (${machine.code})`,
        message: `Downtime reported: ${category} - ${reasonDescription}`,
        type: 'CRITICAL',
        category: 'DOWNTIME',
        relatedEntityId: machine._id.toString(),
        relatedEntityType: 'Machine'
      });

      await logAudit(req, 'REPORT_DOWNTIME', 'DowntimeEvent', event._id.toString(), undefined, req.body);

      res.status(201).json({ success: true, message: 'Downtime reported.', event });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async resolveDowntime(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { resolutionRemarks, endTime } = req.body;

      const event = await DowntimeEvent.findById(id);
      if (!event) {
        res.status(404).json({ success: false, message: 'Downtime event not found.' });
        return;
      }

      const resolvedAt = endTime ? new Date(endTime) : new Date();
      const durationMinutes = Math.max(0, Math.round((resolvedAt.getTime() - event.startTime.getTime()) / (1000 * 60)));

      event.active = false;
      event.endTime = resolvedAt;
      event.durationMinutes = durationMinutes;
      event.resolvedBy = req.user?._id;
      event.resolutionRemarks = resolutionRemarks;
      await event.save();

      const machine = await Machine.findById(event.machineId);
      if (machine) {
        machine.state = MachineState.IDLE;
        machine.lastStateChange = new Date();
        await machine.save();
      }

      await logAudit(req, 'RESOLVE_DOWNTIME', 'DowntimeEvent', id, undefined, { durationMinutes, resolutionRemarks });

      res.json({ success: true, message: 'Downtime event resolved.', event });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getDowntimePareto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = {};
      if (req.plantId) filter.plantId = new mongoose.Types.ObjectId(req.plantId);

      const pareto = await DowntimeEvent.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$category',
            totalMinutes: { $sum: '$durationMinutes' },
            eventCount: { $sum: 1 }
          }
        },
        { $sort: { totalMinutes: -1 } }
      ]);

      res.json({ success: true, pareto });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
