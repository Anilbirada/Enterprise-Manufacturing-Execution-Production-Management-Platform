import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { TraceabilityService } from '../services/traceabilityService';
import { Batch } from '../models/Batch';
import { WorkOrder } from '../models/WorkOrder';
import { logAudit } from '../middlewares/audit';

export class TraceabilityController {
  public static async getGenealogy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      if (!code) {
        res.status(400).json({ success: false, message: 'Tracking code is required.' });
        return;
      }

      const result = await TraceabilityService.getGenealogy(code);
      if (!result.found) {
        res.status(404).json({
          success: false,
          message: `No production genealogy found for tracking code "${code}".`
        });
        return;
      }

      res.json({ success: true, genealogy: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async generateQRCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { data } = req.body;
      if (!data) {
        res.status(400).json({ success: false, message: 'Data payload is required for QR code generation.' });
        return;
      }

      const qrDataUrl = await TraceabilityService.generateQRCode(data);
      res.json({ success: true, qrDataUrl });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getBatches(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = {};
      if (req.plantId) filter.plantId = req.plantId;
      if (req.query.status) filter.status = req.query.status;

      const batches = await Batch.find(filter)
        .populate('productId', 'name code category uom')
        .populate('workOrderId', 'orderNumber plannedQuantity completedQuantity status')
        .sort({ createdAt: -1 });

      res.json({ success: true, count: batches.length, batches });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
