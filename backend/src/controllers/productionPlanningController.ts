import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { ProductionPlan } from '../models/ProductionPlan';
import { WorkOrder } from '../models/WorkOrder';
import { ProductionLine } from '../models/ProductionLine';
import { logAudit } from '../middlewares/audit';
import mongoose from 'mongoose';

export class ProductionPlanningController {
  public static async getPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = {};
      if (req.plantId) filter.plantId = req.plantId;

      const plans = await ProductionPlan.find(filter)
        .populate('items.workOrderId', 'orderNumber plannedQuantity completedQuantity status priority')
        .populate('items.productionLineId', 'name code targetPerHour')
        .populate('items.shiftId', 'name code startTime endTime')
        .populate('createdBy', 'name email')
        .sort({ periodStart: -1 });

      res.json({ success: true, count: plans.length, plans });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { planNumber, title, periodStart, periodEnd, items, notes } = req.body;
      if (!planNumber || !title || !periodStart || !periodEnd) {
        res.status(400).json({ success: false, message: 'Plan number, title, and period dates are required.' });
        return;
      }

      const plan = await ProductionPlan.create({
        plantId: new mongoose.Types.ObjectId(req.body.plantId || req.plantId),
        planNumber: planNumber.trim().toUpperCase(),
        title,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        status: 'Draft',
        items: items || [],
        createdBy: req.user?._id || new mongoose.Types.ObjectId(),
        notes
      });

      await logAudit(req, 'CREATE_PRODUCTION_PLAN', 'ProductionPlan', plan._id.toString(), undefined, req.body);

      res.status(201).json({ success: true, message: 'Production plan created.', plan });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getGanttSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = {};
      if (req.plantId) filter.plantId = req.plantId;

      const orders = await WorkOrder.find({
        ...filter,
        status: { $nin: ['Draft', 'Cancelled'] }
      })
        .populate('productId', 'name code uom standardCycleTimeSeconds')
        .populate('productionLineId', 'name code targetPerHour capacityPerShift')
        .populate('shiftId', 'name code startTime endTime')
        .sort({ startDatePlanned: 1 });

      const lines = await ProductionLine.find({ ...filter, active: true });

      const lineSchedules = lines.map((line) => {
        const lineOrders = orders.filter(
          (o) => o.productionLineId && (o.productionLineId as any)._id.toString() === line._id.toString()
        );

        return {
          lineId: line._id,
          lineName: line.name,
          lineCode: line.code,
          targetPerHour: line.targetPerHour,
          orders: lineOrders.map((o) => ({
            id: o._id,
            orderNumber: o.orderNumber,
            productName: (o.productId as any)?.name || 'Product',
            plannedQuantity: o.plannedQuantity,
            completedQuantity: o.completedQuantity,
            rejectedQuantity: o.rejectedQuantity,
            priority: o.priority,
            status: o.status,
            startDate: o.startDatePlanned,
            dueDate: o.dueDate,
            isOverdue: new Date(o.dueDate) < new Date() && o.completedQuantity < o.plannedQuantity,
            isQualityHold: o.isQualityHold
          }))
        };
      });

      res.json({ success: true, lines: lineSchedules });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async updateSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { workOrderId, productionLineId, startDatePlanned, dueDate, shiftId } = req.body;

      if (!workOrderId) {
        res.status(400).json({ success: false, message: 'workOrderId is required.' });
        return;
      }

      const updateData: any = {};
      if (productionLineId) updateData.productionLineId = productionLineId;
      if (startDatePlanned) updateData.startDatePlanned = new Date(startDatePlanned);
      if (dueDate) updateData.dueDate = new Date(dueDate);
      if (shiftId) updateData.shiftId = shiftId;

      const updated = await WorkOrder.findByIdAndUpdate(workOrderId, updateData, { new: true });
      await logAudit(req, 'UPDATE_SCHEDULE_GANTT', 'WorkOrder', workOrderId, undefined, updateData);

      res.json({ success: true, message: 'Schedule updated successfully.', workOrder: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
