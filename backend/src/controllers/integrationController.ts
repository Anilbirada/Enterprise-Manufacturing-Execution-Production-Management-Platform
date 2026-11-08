import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { IntegrationConfig } from '../models/IntegrationConfig';
import { IndustrialSimulationAdapter } from '../adapters/industrialSimulationAdapter';
import { ERPAdapter } from '../adapters/erpAdapter';
import { Product } from '../models/Product';
import { Material } from '../models/Material';
import { WorkOrder } from '../models/WorkOrder';
import { logAudit } from '../middlewares/audit';
import mongoose from 'mongoose';

export class IntegrationController {
  public static async getConfigs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = {};
      if (req.plantId) filter.plantId = req.plantId;
      const configs = await IntegrationConfig.find(filter).sort({ createdAt: -1 });
      res.json({ success: true, count: configs.length, configs });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const config = await IntegrationConfig.create({
        ...req.body,
        plantId: req.body.plantId || req.plantId,
        status: 'CONNECTED',
        lastPingAt: new Date()
      });
      await logAudit(req, 'CREATE_INTEGRATION_CONFIG', 'IntegrationConfig', config._id.toString(), undefined, req.body);
      res.status(201).json({ success: true, config });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async receiveWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { event, payload } = req.body;
      console.log(`[Integration Webhook Received]: Event ${event}`, payload);

      res.json({
        success: true,
        message: 'Webhook received and queued for processing.',
        timestamp: new Date()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async toggleSimulation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { enable } = req.body;
      if (enable) {
        IndustrialSimulationAdapter.startSimulation(3000);
      } else {
        IndustrialSimulationAdapter.stopSimulation();
      }
      res.json({
        success: true,
        simulationActive: Boolean(enable),
        message: enable ? 'Industrial telemetry simulation started.' : 'Simulation stopped.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async importERPBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { entityType, records } = req.body;
      if (!entityType || !Array.isArray(records)) {
        res.status(400).json({ success: false, message: 'entityType and records array are required.' });
        return;
      }

      let importedCount = 0;
      const plantId = new mongoose.Types.ObjectId(req.body.plantId || req.plantId);

      if (entityType === 'Product') {
        for (const item of records) {
          if (item.code && item.name) {
            await Product.findOneAndUpdate(
              { plantId, code: item.code.trim().toUpperCase() },
              { ...item, plantId, active: true },
              { upsert: true, new: true }
            );
            importedCount++;
          }
        }
      } else if (entityType === 'Material') {
        for (const item of records) {
          if (item.code && item.name) {
            await Material.findOneAndUpdate(
              { plantId, code: item.code.trim().toUpperCase() },
              { ...item, plantId, active: true },
              { upsert: true, new: true }
            );
            importedCount++;
          }
        }
      }

      await logAudit(req, 'ERP_BATCH_IMPORT', entityType, undefined, undefined, { importedCount });

      res.json({
        success: true,
        message: `Successfully processed ${importedCount} ${entityType} records from ERP payload.`,
        importedCount
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
