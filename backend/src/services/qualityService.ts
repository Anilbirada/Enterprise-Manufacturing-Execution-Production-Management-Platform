import { QualityPlan } from '../models/QualityPlan';
import { Inspection, IInspection } from '../models/Inspection';
import { NonConformance } from '../models/NonConformance';
import { QualityHold } from '../models/QualityHold';
import { WorkOrder } from '../models/WorkOrder';
import { TraceabilityEvent } from '../models/TraceabilityEvent';
import { QualityDisposition, InspectionType } from '../config/constants';
import mongoose from 'mongoose';

export class QualityService {
  /**
   * Record quality inspection result
   */
  public static async recordInspection(params: {
    plantId: string;
    inspectionNumber: string;
    workOrderId?: string;
    productId: string;
    batchNumber?: string;
    machineId?: string;
    operationSequence?: number;
    inspectionType: InspectionType;
    sampleSize: number;
    inspectedQuantity: number;
    passedQuantity: number;
    rejectedQuantity: number;
    reworkQuantity?: number;
    disposition: QualityDisposition;
    defectReason?: string;
    parameterResults: any[];
    inspectorId: string;
    notes?: string;
  }): Promise<IInspection> {
    const inspection = await Inspection.create({
      plantId: new mongoose.Types.ObjectId(params.plantId),
      inspectionNumber: params.inspectionNumber,
      workOrderId: params.workOrderId ? new mongoose.Types.ObjectId(params.workOrderId) : undefined,
      productId: new mongoose.Types.ObjectId(params.productId),
      batchNumber: params.batchNumber,
      machineId: params.machineId ? new mongoose.Types.ObjectId(params.machineId) : undefined,
      operationSequence: params.operationSequence,
      inspectionType: params.inspectionType,
      sampleSize: params.sampleSize,
      inspectedQuantity: params.inspectedQuantity,
      passedQuantity: params.passedQuantity,
      rejectedQuantity: params.rejectedQuantity,
      reworkQuantity: params.reworkQuantity || 0,
      disposition: params.disposition,
      defectReason: params.defectReason,
      parameterResults: params.parameterResults,
      inspectorId: new mongoose.Types.ObjectId(params.inspectorId),
      notes: params.notes,
      inspectedAt: new Date()
    });

    // If rejected, automatically generate a Nonconformance Report (NCR)
    if (params.disposition === QualityDisposition.REJECTED && params.rejectedQuantity > 0) {
      const ncrCount = await NonConformance.countDocuments({ plantId: params.plantId });
      const ncrNumber = `NCR-${new Date().getFullYear()}-${String(ncrCount + 1).padStart(4, '0')}`;

      await NonConformance.create({
        plantId: new mongoose.Types.ObjectId(params.plantId),
        ncrNumber,
        inspectionId: inspection._id,
        workOrderId: params.workOrderId ? new mongoose.Types.ObjectId(params.workOrderId) : undefined,
        productId: new mongoose.Types.ObjectId(params.productId),
        batchNumber: params.batchNumber,
        defectCategory: params.defectReason || 'Quality Non-conformance',
        defectDescription: `Auto-generated from inspection ${params.inspectionNumber}. Rejected count: ${params.rejectedQuantity}`,
        quantityAffected: params.rejectedQuantity,
        status: 'Open',
        reportedBy: new mongoose.Types.ObjectId(params.inspectorId)
      });
    }

    // Log traceability event
    if (params.workOrderId || params.batchNumber) {
      await TraceabilityEvent.create({
        plantId: new mongoose.Types.ObjectId(params.plantId),
        trackingCode: params.batchNumber || params.inspectionNumber,
        codeType: params.batchNumber ? 'Batch' : 'WorkOrder',
        eventType: params.disposition === QualityDisposition.ACCEPTED ? 'INSPECTION_PASSED' : 'QUALITY_INSPECTION',
        workOrderId: params.workOrderId ? new mongoose.Types.ObjectId(params.workOrderId) : undefined,
        productId: new mongoose.Types.ObjectId(params.productId),
        operatorId: new mongoose.Types.ObjectId(params.inspectorId),
        details: {
          inspectionNumber: params.inspectionNumber,
          disposition: params.disposition,
          passedQuantity: params.passedQuantity,
          rejectedQuantity: params.rejectedQuantity,
          defectReason: params.defectReason
        }
      });
    }

    return inspection;
  }

  /**
   * Place Quality Hold
   */
  public static async placeQualityHold(params: {
    plantId: string;
    entityType: 'WorkOrder' | 'Batch' | 'Machine' | 'ProductionLine';
    entityId: string;
    entityIdentifier: string;
    reason: string;
    placedBy: string;
    placedByName: string;
  }) {
    const holdCount = await QualityHold.countDocuments({ plantId: params.plantId });
    const holdNumber = `QHOLD-${new Date().getFullYear()}-${String(holdCount + 1).padStart(4, '0')}`;

    const hold = await QualityHold.create({
      plantId: new mongoose.Types.ObjectId(params.plantId),
      holdNumber,
      entityType: params.entityType,
      entityId: new mongoose.Types.ObjectId(params.entityId),
      entityIdentifier: params.entityIdentifier,
      reason: params.reason,
      placedBy: new mongoose.Types.ObjectId(params.placedBy),
      placedByName: params.placedByName,
      status: 'Active',
      placedAt: new Date()
    });

    // If target is WorkOrder, toggle isQualityHold = true
    if (params.entityType === 'WorkOrder') {
      await WorkOrder.findByIdAndUpdate(params.entityId, {
        isQualityHold: true,
        qualityHoldReason: params.reason
      });
    }

    return hold;
  }

  /**
   * Release Quality Hold
   */
  public static async releaseQualityHold(params: {
    holdId: string;
    releasedBy: string;
    releasedByName: string;
    releaseJustification: string;
  }) {
    const hold = await QualityHold.findById(params.holdId);
    if (!hold) {
      throw new Error(`Quality hold ${params.holdId} not found.`);
    }

    hold.status = 'Released';
    hold.releasedBy = new mongoose.Types.ObjectId(params.releasedBy);
    hold.releasedByName = params.releasedByName;
    hold.releaseJustification = params.releaseJustification;
    hold.releasedAt = new Date();
    await hold.save();

    // Release on WorkOrder if no other active holds exist
    if (hold.entityType === 'WorkOrder') {
      const otherHolds = await QualityHold.findOne({
        entityId: hold.entityId,
        status: 'Active'
      });
      if (!otherHolds) {
        await WorkOrder.findByIdAndUpdate(hold.entityId, {
          isQualityHold: false,
          qualityHoldReason: undefined
        });
      }
    }

    return hold;
  }
}
