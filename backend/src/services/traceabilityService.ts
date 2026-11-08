import QRCode from 'qrcode';
import { Batch } from '../models/Batch';
import { WorkOrder } from '../models/WorkOrder';
import { ProductionEntry } from '../models/ProductionEntry';
import { Inspection } from '../models/Inspection';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { TraceabilityEvent } from '../models/TraceabilityEvent';

export class TraceabilityService {
  /**
   * Generate QR Code as Data URL
   */
  public static async generateQRCode(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: {
          dark: '#0B192C',
          light: '#FFFFFF'
        }
      });
    } catch (err: any) {
      throw new Error(`QR Code generation failed: ${err.message}`);
    }
  }

  /**
   * Backward Traceability: Product / Batch / Serial -> Genealogy tree
   */
  public static async getGenealogy(trackingCode: string) {
    const code = trackingCode.trim().toUpperCase();

    // 1. Look for Batch
    let batch = await Batch.findOne({
      $or: [{ batchNumber: code }, { serialNumbers: code }]
    }).populate('productId').populate('workOrderId');

    // 2. Look for WorkOrder
    let workOrder = null;
    if (batch?.workOrderId) {
      workOrder = batch.workOrderId;
    } else {
      workOrder = await WorkOrder.findOne({
        $or: [{ orderNumber: code }, { batchNumber: code }]
      }).populate('productId').populate('productionLineId').populate('shiftId').populate('supervisorId');
    }

    const workOrderId = workOrder?._id || batch?.workOrderId;

    // 3. Find all Production Entries (Operations performed, operators, machines, times)
    const productionEntries = workOrderId
      ? await ProductionEntry.find({ workOrderId })
          .populate('machineId')
          .populate('operatorId', 'name email role')
          .sort({ operationSequence: 1, startTime: 1 })
      : [];

    // 4. Find all Quality Inspections
    const inspections = workOrderId
      ? await Inspection.find({
          $or: [{ workOrderId }, { batchNumber: code }]
        }).populate('inspectorId', 'name email role')
      : [];

    // 5. Find Raw Material Lots consumed
    const materialTransactions = workOrderId
      ? await InventoryTransaction.find({
          workOrderId,
          type: 'CONSUMPTION'
        }).populate('materialId')
      : [];

    // 6. Traceability Timeline Events
    const timelineEvents = await TraceabilityEvent.find({
      $or: [{ trackingCode: code }, { workOrderId }]
    }).sort({ timestamp: 1 });

    return {
      trackingCode: code,
      found: Boolean(batch || workOrder || timelineEvents.length > 0),
      batch,
      workOrder,
      operations: productionEntries,
      inspections,
      consumedMaterials: materialTransactions,
      timelineEvents
    };
  }
}
