import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { OEEService } from '../services/oeeService';
import { KPISettings } from '../models/KPISettings';
import { Machine } from '../models/Machine';
import { ProductionLine } from '../models/ProductionLine';
import { logAudit } from '../middlewares/audit';
import mongoose from 'mongoose';

export class OEEController {
  public static async getPlantOEE(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const plantId = req.query.plantId as string || req.plantId;
      if (!plantId) {
        res.status(400).json({ success: false, message: 'plantId is required.' });
        return;
      }

      const endDate = req.query.toDate ? new Date(req.query.toDate as string) : new Date();
      const startDate = req.query.fromDate
        ? new Date(req.query.fromDate as string)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await OEEService.calculatePlantOEE(plantId, startDate, endDate);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getMachineOEE(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { machineId } = req.params;
      const endDate = req.query.toDate ? new Date(req.query.toDate as string) : new Date();
      const startDate = req.query.fromDate
        ? new Date(req.query.fromDate as string)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await OEEService.calculateMachineOEE(machineId, startDate, endDate);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getMachinesOEEComparison(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = { active: true };
      if (req.plantId) filter.plantId = req.plantId;
      if (req.query.productionLineId) filter.productionLineId = req.query.productionLineId;

      const machines = await Machine.find(filter);
      const endDate = req.query.toDate ? new Date(req.query.toDate as string) : new Date();
      const startDate = req.query.fromDate
        ? new Date(req.query.fromDate as string)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

      const oeeList = await Promise.all(
        machines.map((m) => OEEService.calculateMachineOEE(m._id.toString(), startDate, endDate))
      );

      res.json({ success: true, count: oeeList.length, machines: oeeList });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getKPISettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const plantId = req.query.plantId as string || req.plantId;
      const settings = await KPISettings.findOne({ plantId }) || {
        plantId,
        formulaVersion: '1.0',
        excludePlannedBreaks: true,
        excludePlannedMaintenanceFromUnplannedDowntime: true,
        availabilityTargetPercent: 90,
        performanceTargetPercent: 95,
        qualityTargetPercent: 99,
        oeeTargetPercent: 85,
        minDataThresholdMinutes: 15
      };

      res.json({ success: true, settings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async updateKPISettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const plantId = req.body.plantId || req.plantId;
      const updated = await KPISettings.findOneAndUpdate(
        { plantId },
        { ...req.body, updatedBy: req.user?._id },
        { upsert: true, new: true }
      );

      await logAudit(req, 'UPDATE_KPI_SETTINGS', 'KPISettings', plantId, undefined, req.body);

      res.json({ success: true, message: 'KPI settings updated.', settings: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
