import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { WorkInstruction } from '../models/WorkInstruction';
import { logAudit } from '../middlewares/audit';
import mongoose from 'mongoose';

export class WorkInstructionController {
  public static async getInstructions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = { active: true };
      if (req.plantId) filter.plantId = req.plantId;
      if (req.query.productId) filter.productId = req.query.productId;

      const instructions = await WorkInstruction.find(filter)
        .populate('productId', 'name code category')
        .sort({ code: 1 });

      res.json({ success: true, count: instructions.length, instructions });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getInstructionById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instruction = await WorkInstruction.findById(req.params.id).populate('productId');
      if (!instruction) {
        res.status(404).json({ success: false, message: 'Work instruction not found.' });
        return;
      }
      res.json({ success: true, instruction });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createInstruction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instruction = await WorkInstruction.create({
        ...req.body,
        plantId: req.body.plantId || req.plantId
      });
      await logAudit(req, 'CREATE_WORK_INSTRUCTION', 'WorkInstruction', instruction._id.toString(), undefined, req.body);
      res.status(201).json({ success: true, instruction });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async signOff(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { workOrderId } = req.body;

      const instruction = await WorkInstruction.findById(id);
      if (!instruction) {
        res.status(404).json({ success: false, message: 'Work instruction not found.' });
        return;
      }

      instruction.signOffs.push({
        operatorId: req.user?._id || new mongoose.Types.ObjectId(),
        operatorName: req.user?.name || 'Operator',
        workOrderId: workOrderId ? new mongoose.Types.ObjectId(workOrderId) : undefined,
        signedAt: new Date()
      });

      await instruction.save();
      await logAudit(req, 'SIGN_OFF_WORK_INSTRUCTION', 'WorkInstruction', id, undefined, { workOrderId });

      res.json({ success: true, message: 'Work instruction acknowledged and signed off.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
