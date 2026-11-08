import { WorkOrder, IWorkOrder } from '../models/WorkOrder';
import { WorkOrderStatus } from '../config/constants';
import { QualityHold } from '../models/QualityHold';
import mongoose from 'mongoose';

export class WorkOrderService {
  // Allowed transition graph
  private static readonly VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
    [WorkOrderStatus.DRAFT]: [WorkOrderStatus.PLANNED, WorkOrderStatus.CANCELLED],
    [WorkOrderStatus.PLANNED]: [WorkOrderStatus.RELEASED, WorkOrderStatus.DRAFT, WorkOrderStatus.CANCELLED],
    [WorkOrderStatus.RELEASED]: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.PLANNED, WorkOrderStatus.CANCELLED],
    [WorkOrderStatus.IN_PROGRESS]: [WorkOrderStatus.PAUSED, WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED],
    [WorkOrderStatus.PAUSED]: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
    [WorkOrderStatus.COMPLETED]: [], // Terminal state (re-opening requires specific admin reversal)
    [WorkOrderStatus.CANCELLED]: [] // Terminal state
  };

  /**
   * Validate if a status transition is valid
   */
  public static isValidTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
    const allowed = this.VALID_TRANSITIONS[from] || [];
    return allowed.includes(to);
  }

  /**
   * Transition work order status with quality hold checking and audit history
   */
  public static async transitionStatus(
    workOrderId: string,
    toStatus: WorkOrderStatus,
    userId: string,
    userName: string,
    reason?: string
  ): Promise<IWorkOrder> {
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      throw new Error(`Work Order ${workOrderId} not found.`);
    }

    const currentStatus = workOrder.status;

    // 1. Check valid transition
    if (!this.isValidTransition(currentStatus, toStatus)) {
      throw new Error(
        `Invalid status transition from "${currentStatus}" to "${toStatus}". Allowed transitions: ${
          this.VALID_TRANSITIONS[currentStatus]?.join(', ') || 'None (terminal)'
        }`
      );
    }

    // 2. Check quality hold (if moving to In Progress or Completed)
    if (toStatus === WorkOrderStatus.IN_PROGRESS || toStatus === WorkOrderStatus.COMPLETED) {
      const activeHold = await QualityHold.findOne({
        entityId: workOrder._id,
        status: 'Active'
      });

      if (activeHold || workOrder.isQualityHold) {
        throw new Error(
          `Cannot transition Work Order ${workOrder.orderNumber} to "${toStatus}". An active Quality Hold is in effect: "${
            activeHold?.reason || workOrder.qualityHoldReason || 'Quality Hold'
          }". Quality Manager must release the hold first.`
        );
      }
    }

    // 3. Update timestamps
    if (toStatus === WorkOrderStatus.IN_PROGRESS && !workOrder.actualStartTime) {
      workOrder.actualStartTime = new Date();
    }
    if (toStatus === WorkOrderStatus.COMPLETED) {
      workOrder.actualEndTime = new Date();
    }

    // 4. Record history
    workOrder.status = toStatus;
    workOrder.history.push({
      fromStatus: currentStatus,
      toStatus,
      changedBy: new mongoose.Types.ObjectId(userId),
      changedByName: userName,
      timestamp: new Date(),
      reason
    });

    await workOrder.save();
    return workOrder;
  }
}
