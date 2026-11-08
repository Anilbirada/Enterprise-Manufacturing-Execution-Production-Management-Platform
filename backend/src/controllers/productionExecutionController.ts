import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { ProductionExecutionService } from '../services/productionExecutionService';
import { WorkOrder } from '../models/WorkOrder';
import { ProductionEntry } from '../models/ProductionEntry';
import { Machine } from '../models/Machine';
import { MachineState, WorkOrderStatus } from '../config/constants';
import { logAudit } from '../middlewares/audit';

export class ProductionExecutionController {
  public static async getOperatorJobs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = {
        status: { $in: [WorkOrderStatus.RELEASED, WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.PAUSED] }
      };

      if (req.plantId) filter.plantId = req.plantId;
      if (req.query.machineId) {
        const machine = await Machine.findById(req.query.machineId);
        if (machine?.productionLineId) {
          filter.productionLineId = machine.productionLineId;
        }
      }

      const jobs = await WorkOrder.find(filter)
        .populate('productId')
        .populate('routingId')
        .populate('productionLineId')
        .populate('shiftId')
        .sort({ priority: -1, startDatePlanned: 1 });

      res.json({ success: true, count: jobs.length, jobs });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async recordProduction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        workOrderId,
        machineId,
        shiftId,
        operationSequence,
        goodQuantity,
        rejectedQuantity,
        reworkQuantity,
        rejectionReason,
        defectCategory,
        startTime,
        endTime,
        durationMinutes,
        notes,
        idempotencyKey
      } = req.body;

      if (!workOrderId || !machineId || !shiftId || goodQuantity === undefined) {
        res.status(400).json({
          success: false,
          message: 'workOrderId, machineId, shiftId, and goodQuantity are required.'
        });
        return;
      }

      const entry = await ProductionExecutionService.recordProduction({
        plantId: req.body.plantId || req.plantId || '',
        workOrderId,
        machineId,
        shiftId,
        operatorId: req.user?._id.toString() || '',
        operatorName: req.user?.name || 'Operator',
        operationSequence: operationSequence || 10,
        goodQuantity: Number(goodQuantity),
        rejectedQuantity: Number(rejectedQuantity || 0),
        reworkQuantity: Number(reworkQuantity || 0),
        rejectionReason,
        defectCategory,
        startTime: startTime ? new Date(startTime) : new Date(Date.now() - (durationMinutes || 60) * 60000),
        endTime: endTime ? new Date(endTime) : new Date(),
        durationMinutes: Number(durationMinutes || 60),
        notes,
        idempotencyKey
      });

      await logAudit(req, 'PRODUCTION_BOOKING', 'ProductionEntry', entry._id.toString(), undefined, {
        workOrderId,
        goodQuantity,
        rejectedQuantity
      });

      res.status(201).json({
        success: true,
        message: 'Production quantity booked successfully.',
        entry
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async getProductionEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { workOrderId, machineId, date } = req.query;
      const filter: any = {};

      if (req.plantId) filter.plantId = req.plantId;
      if (workOrderId) filter.workOrderId = workOrderId;
      if (machineId) filter.machineId = machineId;
      if (date) {
        const start = new Date(date as string);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date as string);
        end.setHours(23, 59, 59, 999);
        filter.startTime = { $gte: start, $lte: end };
      }

      const entries = await ProductionEntry.find(filter)
        .populate('workOrderId', 'orderNumber plannedQuantity completedQuantity status')
        .populate('productId', 'name code uom')
        .populate('machineId', 'name code')
        .populate('shiftId', 'name code')
        .populate('operatorId', 'name email')
        .sort({ createdAt: -1 });

      res.json({ success: true, count: entries.length, entries });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
