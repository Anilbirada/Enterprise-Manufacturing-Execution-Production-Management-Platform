import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { AndonIssue } from '../models/AndonIssue';
import { AndonStatus, AndonSeverity } from '../config/constants';
import { NotificationAdapter } from '../adapters/notificationAdapter';
import { logAudit } from '../middlewares/audit';
import mongoose from 'mongoose';

export class AndonController {
  public static async getAndonBoard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = {};
      if (req.plantId) filter.plantId = req.plantId;
      if (req.query.status) {
        filter.status = req.query.status;
      } else {
        filter.status = { $in: [AndonStatus.OPEN, AndonStatus.ACKNOWLEDGED, AndonStatus.IN_PROGRESS] };
      }

      const issues = await AndonIssue.find(filter)
        .populate('productionLineId', 'name code')
        .populate('machineId', 'name code state')
        .populate('workOrderId', 'orderNumber')
        .populate('reportedBy', 'name email')
        .populate('acknowledgedBy', 'name email')
        .populate('assignedEngineerId', 'name email')
        .sort({ severity: -1, reportedAt: -1 });

      res.json({ success: true, count: issues.length, issues });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async reportIssue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { productionLineId, machineId, workOrderId, title, description, category, severity } = req.body;

      if (!productionLineId || !title || !description) {
        res.status(400).json({ success: false, message: 'Production Line, title, and description are required.' });
        return;
      }

      const count = await AndonIssue.countDocuments();
      const issueNumber = `AND-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const issue = await AndonIssue.create({
        plantId: new mongoose.Types.ObjectId(req.body.plantId || req.plantId),
        issueNumber,
        productionLineId: new mongoose.Types.ObjectId(productionLineId),
        machineId: machineId ? new mongoose.Types.ObjectId(machineId) : undefined,
        workOrderId: workOrderId ? new mongoose.Types.ObjectId(workOrderId) : undefined,
        title,
        description,
        category,
        severity: severity || AndonSeverity.MEDIUM,
        status: AndonStatus.OPEN,
        reportedBy: req.user?._id || new mongoose.Types.ObjectId(),
        reportedAt: new Date()
      });

      await NotificationAdapter.sendNotification({
        plantId: req.body.plantId || req.plantId || '',
        title: `Andon Alert [${severity || 'MEDIUM'}]: ${title}`,
        message: description,
        type: severity === AndonSeverity.CRITICAL ? 'CRITICAL' : 'WARNING',
        category: 'ANDON_CRITICAL',
        relatedEntityId: issue._id.toString(),
        relatedEntityType: 'AndonIssue'
      });

      await logAudit(req, 'REPORT_ANDON_ISSUE', 'AndonIssue', issue._id.toString(), undefined, req.body);

      res.status(201).json({ success: true, message: 'Andon issue raised.', issue });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async acknowledgeIssue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { assignedEngineerId } = req.body;

      const issue = await AndonIssue.findById(id);
      if (!issue) {
        res.status(404).json({ success: false, message: 'Andon issue not found.' });
        return;
      }

      issue.status = AndonStatus.ACKNOWLEDGED;
      issue.acknowledgedBy = req.user?._id;
      issue.acknowledgedAt = new Date();
      if (assignedEngineerId) {
        issue.assignedEngineerId = new mongoose.Types.ObjectId(assignedEngineerId);
      }
      await issue.save();

      await logAudit(req, 'ACKNOWLEDGE_ANDON', 'AndonIssue', id);

      res.json({ success: true, message: 'Andon issue acknowledged.', issue });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async resolveIssue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { resolutionNotes } = req.body;

      const issue = await AndonIssue.findById(id);
      if (!issue) {
        res.status(404).json({ success: false, message: 'Andon issue not found.' });
        return;
      }

      issue.status = AndonStatus.RESOLVED;
      issue.resolvedBy = req.user?._id;
      issue.resolvedAt = new Date();
      issue.resolutionNotes = resolutionNotes;
      await issue.save();

      await logAudit(req, 'RESOLVE_ANDON', 'AndonIssue', id, undefined, { resolutionNotes });

      res.json({ success: true, message: 'Andon issue resolved.', issue });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async escalateIssue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const issue = await AndonIssue.findById(id);
      if (!issue) {
        res.status(404).json({ success: false, message: 'Andon issue not found.' });
        return;
      }

      issue.isEscalated = true;
      issue.escalatedAt = new Date();
      issue.escalationLevel += 1;
      issue.severity = AndonSeverity.CRITICAL;
      await issue.save();

      await NotificationAdapter.sendNotification({
        plantId: issue.plantId.toString(),
        targetRole: 'Plant Manager',
        title: `ESCALATION: Andon Issue ${issue.issueNumber}`,
        message: `Issue escalated to Level ${issue.escalationLevel}: ${issue.title}`,
        type: 'CRITICAL',
        category: 'ANDON_CRITICAL',
        relatedEntityId: issue._id.toString(),
        relatedEntityType: 'AndonIssue'
      });

      await logAudit(req, 'ESCALATE_ANDON', 'AndonIssue', id, undefined, { level: issue.escalationLevel });

      res.json({ success: true, message: 'Andon issue escalated to management.', issue });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
