import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { WorkOrder } from '../models/WorkOrder';
import { Batch } from '../models/Batch';
import { WorkOrderService } from '../services/workOrderService';
import { WorkOrderStatus } from '../config/constants';
import { logAudit } from '../middlewares/audit';
import mongoose from 'mongoose';

export class WorkOrderController {
  public static async getWorkOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, productionLineId, shiftId, priority, fromDate, toDate } = req.query;
      const filter: any = {};

      if (req.plantId) filter.plantId = req.plantId;
      if (status) filter.status = status;
      if (productionLineId) filter.productionLineId = productionLineId;
      if (shiftId) filter.shiftId = shiftId;
      if (priority) filter.priority = priority;

      if (fromDate || toDate) {
        filter.startDatePlanned = {};
        if (fromDate) filter.startDatePlanned.$gte = new Date(fromDate as string);
        if (toDate) filter.startDatePlanned.$lte = new Date(toDate as string);
      }

      const orders = await WorkOrder.find(filter)
        .populate('productId', 'name code category uom')
        .populate('productionLineId', 'name code')
        .populate('shiftId', 'name code startTime endTime')
        .populate('supervisorId', 'name email')
        .populate('assignedOperatorId', 'name email')
        .sort({ createdAt: -1 });

      res.json({ success: true, count: orders.length, orders });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getWorkOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const order = await WorkOrder.findById(req.params.id)
        .populate('productId')
        .populate('routingId')
        .populate('productionLineId')
        .populate('shiftId')
        .populate('supervisorId', 'name email')
        .populate('assignedOperatorId', 'name email');

      if (!order) {
        res.status(404).json({ success: false, message: 'Work Order not found.' });
        return;
      }

      res.json({ success: true, order });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        orderNumber,
        productId,
        routingId,
        productionLineId,
        shiftId,
        supervisorId,
        assignedOperatorId,
        plannedQuantity,
        priority,
        startDatePlanned,
        dueDate,
        instructions
      } = req.body;

      if (!orderNumber || !productId || !plannedQuantity || !startDatePlanned || !dueDate) {
        res.status(400).json({
          success: false,
          message: 'Order number, product, planned quantity, planned start date, and due date are required.'
        });
        return;
      }

      const existing = await WorkOrder.findOne({ orderNumber: orderNumber.trim().toUpperCase() });
      if (existing) {
        res.status(409).json({ success: false, message: `Work Order number ${orderNumber} already exists.` });
        return;
      }

      // Generate Batch Number
      const batchNumber = `BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const workOrder = await WorkOrder.create({
        orderNumber: orderNumber.trim().toUpperCase(),
        plantId: new mongoose.Types.ObjectId(req.body.plantId || req.plantId),
        productId: new mongoose.Types.ObjectId(productId),
        routingId: routingId ? new mongoose.Types.ObjectId(routingId) : undefined,
        productionLineId: productionLineId ? new mongoose.Types.ObjectId(productionLineId) : undefined,
        shiftId: shiftId ? new mongoose.Types.ObjectId(shiftId) : undefined,
        supervisorId: supervisorId ? new mongoose.Types.ObjectId(supervisorId) : req.user?._id,
        assignedOperatorId: assignedOperatorId ? new mongoose.Types.ObjectId(assignedOperatorId) : undefined,
        plannedQuantity,
        priority: priority || 'Medium',
        status: WorkOrderStatus.DRAFT,
        startDatePlanned: new Date(startDatePlanned),
        dueDate: new Date(dueDate),
        batchNumber,
        instructions,
        history: [
          {
            fromStatus: WorkOrderStatus.DRAFT,
            toStatus: WorkOrderStatus.DRAFT,
            changedBy: req.user?._id || new mongoose.Types.ObjectId(),
            changedByName: req.user?.name || 'Administrator',
            timestamp: new Date(),
            reason: 'Work order created in Draft'
          }
        ]
      });

      // Create linked Batch entity
      await Batch.create({
        plantId: workOrder.plantId,
        batchNumber,
        workOrderId: workOrder._id,
        productId: workOrder.productId,
        plannedQuantity,
        status: 'In Production'
      });

      await logAudit(req, 'CREATE_WORK_ORDER', 'WorkOrder', workOrder._id.toString(), undefined, req.body);

      res.status(201).json({ success: true, message: 'Work Order created successfully.', workOrder });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async transitionStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { toStatus, reason } = req.body;

      if (!toStatus) {
        res.status(400).json({ success: false, message: 'Target status (toStatus) is required.' });
        return;
      }

      const updated = await WorkOrderService.transitionStatus(
        id,
        toStatus as WorkOrderStatus,
        req.user?._id.toString() || '',
        req.user?.name || 'Authorized User',
        reason
      );

      await logAudit(req, 'TRANSITION_WORK_ORDER_STATUS', 'WorkOrder', id, undefined, { toStatus, reason });

      res.json({ success: true, message: `Status updated to ${toStatus}`, workOrder: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async updateWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const workOrder = await WorkOrder.findById(id);
      if (!workOrder) {
        res.status(404).json({ success: false, message: 'Work Order not found.' });
        return;
      }

      // If work order is Completed or Cancelled, disallow modification
      if (workOrder.status === WorkOrderStatus.COMPLETED || workOrder.status === WorkOrderStatus.CANCELLED) {
        res.status(400).json({
          success: false,
          message: `Cannot modify Work Order in terminal status "${workOrder.status}".`
        });
        return;
      }

      const updated = await WorkOrder.findByIdAndUpdate(id, req.body, { new: true });
      await logAudit(req, 'UPDATE_WORK_ORDER', 'WorkOrder', id, undefined, req.body);

      res.json({ success: true, message: 'Work order updated.', workOrder: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
