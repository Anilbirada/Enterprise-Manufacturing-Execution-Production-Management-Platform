import { ProductionEntry, IProductionEntry } from '../models/ProductionEntry';
import { WorkOrder } from '../models/WorkOrder';
import { Machine } from '../models/Machine';
import { BOM } from '../models/BOM';
import { Material } from '../models/Material';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { TraceabilityEvent } from '../models/TraceabilityEvent';
import { QualityHold } from '../models/QualityHold';
import { MachineState, WorkOrderStatus } from '../config/constants';
import mongoose from 'mongoose';

export interface RecordProductionParams {
  plantId: string;
  workOrderId: string;
  machineId: string;
  shiftId: string;
  operatorId: string;
  operatorName: string;
  operationSequence: number;
  goodQuantity: number;
  rejectedQuantity: number;
  reworkQuantity?: number;
  rejectionReason?: string;
  defectCategory?: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  notes?: string;
  idempotencyKey?: string;
}

export class ProductionExecutionService {
  public static async recordProduction(params: RecordProductionParams): Promise<IProductionEntry> {
    const {
      plantId,
      workOrderId,
      machineId,
      shiftId,
      operatorId,
      operatorName,
      operationSequence,
      goodQuantity,
      rejectedQuantity,
      reworkQuantity = 0,
      rejectionReason,
      defectCategory,
      startTime,
      endTime,
      durationMinutes,
      notes,
      idempotencyKey
    } = params;

    // 1. Idempotency check: if key already exists, return existing entry to prevent duplicates
    if (idempotencyKey) {
      const existing = await ProductionEntry.findOne({ idempotencyKey });
      if (existing) {
        return existing;
      }
    }

    // 2. Validate Work Order
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      throw new Error(`Work Order with ID ${workOrderId} not found.`);
    }

    // Operators cannot execute Draft, Planned, Paused or Completed WOs
    if (workOrder.status !== WorkOrderStatus.RELEASED && workOrder.status !== WorkOrderStatus.IN_PROGRESS) {
      throw new Error(
        `Cannot record production on Work Order ${workOrder.orderNumber} with status "${workOrder.status}". Work order must be Released or In Progress.`
      );
    }

    // 3. Quality Hold Check
    const activeHold = await QualityHold.findOne({
      entityId: workOrder._id,
      status: 'Active'
    });
    if (activeHold || workOrder.isQualityHold) {
      throw new Error(
        `Operation halted! Work Order ${workOrder.orderNumber} is under active Quality Hold: "${
          activeHold?.reason || workOrder.qualityHoldReason
        }".`
      );
    }

    // 4. Quantities validation
    if (goodQuantity < 0 || rejectedQuantity < 0) {
      throw new Error('Produced quantities cannot be negative.');
    }
    if (goodQuantity === 0 && rejectedQuantity === 0) {
      throw new Error('Total production count (good + rejected) must be greater than zero.');
    }

    // 5. Create immutable ProductionEntry
    const entry = await ProductionEntry.create({
      plantId: new mongoose.Types.ObjectId(plantId),
      workOrderId: workOrder._id,
      productId: workOrder.productId,
      productionLineId: workOrder.productionLineId,
      machineId: new mongoose.Types.ObjectId(machineId),
      shiftId: new mongoose.Types.ObjectId(shiftId),
      operatorId: new mongoose.Types.ObjectId(operatorId),
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
      idempotencyKey,
      isCorrection: false
    });

    // 6. Update Work Order completed and rejected quantities
    workOrder.completedQuantity += goodQuantity;
    workOrder.rejectedQuantity += rejectedQuantity;
    workOrder.reworkQuantity += reworkQuantity;
    if (workOrder.status === WorkOrderStatus.RELEASED) {
      workOrder.status = WorkOrderStatus.IN_PROGRESS;
      if (!workOrder.actualStartTime) {
        workOrder.actualStartTime = startTime;
      }
    }

    // If target achieved, can mark completed
    if (workOrder.completedQuantity >= workOrder.plannedQuantity) {
      workOrder.status = WorkOrderStatus.COMPLETED;
      workOrder.actualEndTime = endTime;
    }
    await workOrder.save();

    // 7. Update Machine status to Running and attach currentWorkOrder
    const machine = await Machine.findById(machineId);
    if (machine) {
      machine.state = MachineState.RUNNING;
      machine.currentWorkOrderId = workOrder._id;
      machine.currentOperatorId = new mongoose.Types.ObjectId(operatorId);
      machine.operatingHoursTotal += Math.round((durationMinutes / 60) * 10) / 10;
      machine.lastStateChange = new Date();
      await machine.save();
    }

    // 8. Auto-consume raw materials based on active BOM if present
    try {
      const bom = await BOM.findOne({ productId: workOrder.productId, active: true });
      if (bom && bom.items.length > 0) {
        for (const item of bom.items) {
          const totalProduced = goodQuantity + rejectedQuantity;
          const scrapMultiplier = 1 + (item.scrapPercentage || 0) / 100;
          const requiredQty = item.quantity * totalProduced * scrapMultiplier;

          const material = await Material.findById(item.materialId);
          if (material) {
            material.currentStock = Math.max(0, material.currentStock - requiredQty);
            await material.save();

            await InventoryTransaction.create({
              plantId: new mongoose.Types.ObjectId(plantId),
              materialId: material._id,
              type: 'CONSUMPTION',
              quantity: -requiredQty,
              balanceAfter: material.currentStock,
              workOrderId: workOrder._id,
              batchNumber: workOrder.batchNumber,
              reason: `Production consumption for WO ${workOrder.orderNumber} (${totalProduced} units)`,
              performedBy: new mongoose.Types.ObjectId(operatorId)
            });
          }
        }
      }
    } catch (bomErr) {
      console.error('[BOM Consumption Warning]', bomErr);
    }

    // 9. Record Traceability Event
    await TraceabilityEvent.create({
      plantId: new mongoose.Types.ObjectId(plantId),
      trackingCode: workOrder.batchNumber || workOrder.orderNumber,
      codeType: workOrder.batchNumber ? 'Batch' : 'WorkOrder',
      eventType: 'OPERATION_COMPLETED',
      workOrderId: workOrder._id,
      productId: workOrder.productId,
      machineId: new mongoose.Types.ObjectId(machineId),
      operatorId: new mongoose.Types.ObjectId(operatorId),
      operatorName,
      details: {
        operationSequence,
        goodQuantity,
        rejectedQuantity,
        durationMinutes,
        notes
      }
    });

    return entry;
  }
}
