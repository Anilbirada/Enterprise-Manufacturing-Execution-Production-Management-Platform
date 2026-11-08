import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { QualityPlan } from '../models/QualityPlan';
import { Inspection } from '../models/Inspection';
import { NonConformance } from '../models/NonConformance';
import { QualityHold } from '../models/QualityHold';
import { QualityService } from '../services/qualityService';
import { logAudit } from '../middlewares/audit';
import mongoose from 'mongoose';

export class QualityController {
  public static async getPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = { active: true };
      if (req.plantId) filter.plantId = req.plantId;

      const plans = await QualityPlan.find(filter).populate('productId', 'name code category');
      res.json({ success: true, count: plans.length, plans });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const plan = await QualityPlan.create({
        ...req.body,
        plantId: req.body.plantId || req.plantId
      });
      await logAudit(req, 'CREATE_QUALITY_PLAN', 'QualityPlan', plan._id.toString(), undefined, req.body);
      res.status(201).json({ success: true, plan });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getInspections(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { inspectionType, disposition, productId, workOrderId } = req.query;
      const filter: any = {};

      if (req.plantId) filter.plantId = req.plantId;
      if (inspectionType) filter.inspectionType = inspectionType;
      if (disposition) filter.disposition = disposition;
      if (productId) filter.productId = productId;
      if (workOrderId) filter.workOrderId = workOrderId;

      const inspections = await Inspection.find(filter)
        .populate('productId', 'name code')
        .populate('workOrderId', 'orderNumber plannedQuantity completedQuantity')
        .populate('machineId', 'name code')
        .populate('inspectorId', 'name email')
        .sort({ inspectedAt: -1 });

      res.json({ success: true, count: inspections.length, inspections });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async recordInspection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const count = await Inspection.countDocuments();
      const inspectionNumber = `INS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const inspection = await QualityService.recordInspection({
        ...req.body,
        inspectionNumber,
        plantId: req.body.plantId || req.plantId || '',
        inspectorId: req.user?._id.toString() || ''
      });

      await logAudit(req, 'RECORD_INSPECTION', 'Inspection', inspection._id.toString(), undefined, req.body);

      res.status(201).json({
        success: true,
        message: 'Inspection recorded successfully.',
        inspection
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async getNonConformances(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = {};
      if (req.plantId) filter.plantId = req.plantId;
      if (req.query.status) filter.status = req.query.status;

      const list = await NonConformance.find(filter)
        .populate('productId', 'name code')
        .populate('workOrderId', 'orderNumber')
        .populate('reportedBy', 'name email')
        .populate('assignedQualityEngineerId', 'name email')
        .sort({ createdAt: -1 });

      res.json({ success: true, count: list.length, list });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async updateNonConformance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await NonConformance.findByIdAndUpdate(id, req.body, { new: true });
      await logAudit(req, 'UPDATE_NCR', 'NonConformance', id, undefined, req.body);
      res.json({ success: true, ncr: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getQualityHolds(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = {};
      if (req.plantId) filter.plantId = req.plantId;
      if (req.query.status) filter.status = req.query.status;

      const holds = await QualityHold.find(filter)
        .populate('placedBy', 'name email')
        .populate('releasedBy', 'name email')
        .sort({ createdAt: -1 });

      res.json({ success: true, count: holds.length, holds });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async placeHold(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { entityType, entityId, entityIdentifier, reason } = req.body;
      if (!entityType || !entityId || !entityIdentifier || !reason) {
        res.status(400).json({ success: false, message: 'entityType, entityId, entityIdentifier, and reason are required.' });
        return;
      }

      const hold = await QualityService.placeQualityHold({
        plantId: req.body.plantId || req.plantId || '',
        entityType,
        entityId,
        entityIdentifier,
        reason,
        placedBy: req.user?._id.toString() || '',
        placedByName: req.user?.name || 'Quality Inspector'
      });

      await logAudit(req, 'PLACE_QUALITY_HOLD', 'QualityHold', hold._id.toString(), undefined, req.body);

      res.status(201).json({ success: true, message: 'Quality hold placed.', hold });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async releaseHold(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { releaseJustification } = req.body;

      if (!releaseJustification) {
        res.status(400).json({ success: false, message: 'releaseJustification is required to release quality hold.' });
        return;
      }

      const hold = await QualityService.releaseQualityHold({
        holdId: id,
        releasedBy: req.user?._id.toString() || '',
        releasedByName: req.user?.name || 'Quality Manager',
        releaseJustification
      });

      await logAudit(req, 'RELEASE_QUALITY_HOLD', 'QualityHold', id, undefined, { releaseJustification });

      res.json({ success: true, message: 'Quality hold released successfully.', hold });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
