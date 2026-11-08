import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { WorkOrder } from '../models/WorkOrder';
import { Machine } from '../models/Machine';
import { ProductionEntry } from '../models/ProductionEntry';
import { DowntimeEvent } from '../models/DowntimeEvent';
import { AndonIssue } from '../models/AndonIssue';
import { OEEService } from '../services/oeeService';
import { MachineState, WorkOrderStatus } from '../config/constants';
import mongoose from 'mongoose';

export class DashboardController {
  public static async getRealtimeDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const plantId = req.query.plantId as string || req.plantId;
      const filter: any = {};
      if (plantId) filter.plantId = new mongoose.Types.ObjectId(plantId);

      // 1. Work Orders Summary
      const allOrders = await WorkOrder.find(filter);
      const plannedTotal = allOrders.reduce((acc, o) => acc + o.plannedQuantity, 0);
      const completedTotal = allOrders.reduce((acc, o) => acc + o.completedQuantity, 0);
      const rejectedTotal = allOrders.reduce((acc, o) => acc + o.rejectedQuantity, 0);

      const activeOrders = allOrders.filter(
        (o) => o.status === WorkOrderStatus.IN_PROGRESS || o.status === WorkOrderStatus.RELEASED
      ).length;
      const completedOrders = allOrders.filter((o) => o.status === WorkOrderStatus.COMPLETED).length;
      const delayedOrders = allOrders.filter(
        (o) => new Date(o.dueDate) < new Date() && o.completedQuantity < o.plannedQuantity
      ).length;

      const achievementPercent = plannedTotal > 0 ? Math.round((completedTotal / plannedTotal) * 1000) / 10 : 0;
      const totalPartsProduced = completedTotal + rejectedTotal;
      const qualityPercent = totalPartsProduced > 0 ? Math.round((completedTotal / totalPartsProduced) * 1000) / 10 : 100;

      // 2. Machines Status Breakdown
      const machines = await Machine.find(filter);
      const machineStatusCounts = {
        running: machines.filter((m) => m.state === MachineState.RUNNING).length,
        idle: machines.filter((m) => m.state === MachineState.IDLE).length,
        stopped: machines.filter((m) => m.state === MachineState.STOPPED).length,
        maintenance: machines.filter((m) => m.state === MachineState.MAINTENANCE).length,
        fault: machines.filter((m) => m.state === MachineState.FAULT).length,
        offline: machines.filter((m) => m.state === MachineState.OFFLINE).length,
        total: machines.length
      };

      // 3. Active Downtime & Andon Alerts
      const activeDowntimeEvents = await DowntimeEvent.find({ ...filter, active: true }).populate('machineId', 'name code');
      const activeAndonIssues = await AndonIssue.find({
        ...filter,
        status: { $in: ['Open', 'Acknowledged', 'In Progress'] }
      }).populate('productionLineId', 'name code');

      // 4. OEE Summary for today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();

      let oeeData = null;
      if (plantId) {
        try {
          oeeData = await OEEService.calculatePlantOEE(plantId, todayStart, todayEnd);
        } catch {}
      }

      // 5. Hourly Production Trend (today)
      const hourlyEntries = await ProductionEntry.aggregate([
        {
          $match: {
            ...filter,
            startTime: { $gte: todayStart, $lte: todayEnd }
          }
        },
        {
          $group: {
            _id: { $hour: '$startTime' },
            goodQuantity: { $sum: '$goodQuantity' },
            rejectedQuantity: { $sum: '$rejectedQuantity' }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      const hourlyTrend = Array.from({ length: 24 }).map((_, hour) => {
        const found = hourlyEntries.find((e) => e._id === hour);
        return {
          hour: `${String(hour).padStart(2, '0')}:00`,
          good: found ? found.goodQuantity : 0,
          rejected: found ? found.rejectedQuantity : 0,
          total: found ? found.goodQuantity + found.rejectedQuantity : 0
        };
      });

      res.json({
        success: true,
        summary: {
          plannedTotal,
          completedTotal,
          rejectedTotal,
          achievementPercent,
          qualityPercent,
          activeOrders,
          completedOrders,
          delayedOrders
        },
        machineStatusCounts,
        activeDowntimeCount: activeDowntimeEvents.length,
        activeDowntimeEvents,
        activeAndonCount: activeAndonIssues.length,
        activeAndonIssues,
        oee: oeeData,
        hourlyTrend
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
