import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Material } from '../models/Material';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { NotificationAdapter } from '../adapters/notificationAdapter';
import { logAudit } from '../middlewares/audit';
import mongoose from 'mongoose';

export class InventoryController {
  public static async getStockSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter: any = { active: true };
      if (req.plantId) filter.plantId = req.plantId;

      const materials = await Material.find(filter).sort({ name: 1 });
      const shortages = materials.filter((m) => m.currentStock <= m.safetyStock);

      res.json({
        success: true,
        count: materials.length,
        shortageCount: shortages.length,
        materials,
        shortages
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async recordTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        materialId,
        type,
        quantity,
        workOrderId,
        batchNumber,
        lotNumber,
        referenceDoc,
        reason
      } = req.body;

      if (!materialId || !type || quantity === undefined) {
        res.status(400).json({ success: false, message: 'materialId, type, and quantity are required.' });
        return;
      }

      const material = await Material.findById(materialId);
      if (!material) {
        res.status(404).json({ success: false, message: 'Material not found.' });
        return;
      }

      const numQty = Number(quantity);
      let balanceAfter = material.currentStock;

      if (type === 'RECEIVE' || type === 'RETURN') {
        balanceAfter += numQty;
      } else if (type === 'ISSUE_TO_PRODUCTION' || type === 'CONSUMPTION' || type === 'SCRAP') {
        if (material.currentStock < numQty) {
          res.status(400).json({
            success: false,
            message: `Insufficient stock for ${material.name}. Available: ${material.currentStock} ${material.uom}, requested: ${numQty}.`
          });
          return;
        }
        balanceAfter -= numQty;
      } else if (type === 'ADJUSTMENT') {
        balanceAfter = numQty;
      }

      material.currentStock = balanceAfter;
      await material.save();

      const txn = await InventoryTransaction.create({
        plantId: material.plantId,
        materialId: material._id,
        type,
        quantity: numQty,
        balanceAfter,
        workOrderId: workOrderId ? new mongoose.Types.ObjectId(workOrderId) : undefined,
        batchNumber,
        lotNumber,
        referenceDoc,
        reason,
        performedBy: req.user?._id || new mongoose.Types.ObjectId()
      });

      if (balanceAfter <= material.safetyStock) {
        await NotificationAdapter.sendNotification({
          plantId: material.plantId.toString(),
          targetRole: 'Warehouse Manager',
          title: `Low Stock Alert: ${material.name}`,
          message: `Stock level (${balanceAfter} ${material.uom}) is at or below safety stock (${material.safetyStock} ${material.uom}).`,
          type: 'WARNING',
          category: 'GENERAL',
          relatedEntityId: material._id.toString(),
          relatedEntityType: 'Material'
        });
      }

      await logAudit(req, 'INVENTORY_TRANSACTION', 'InventoryTransaction', txn._id.toString(), undefined, req.body);

      res.status(201).json({ success: true, message: 'Inventory transaction logged.', transaction: txn, currentStock: balanceAfter });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { materialId, workOrderId, type } = req.query;
      const filter: any = {};

      if (req.plantId) filter.plantId = req.plantId;
      if (materialId) filter.materialId = materialId;
      if (workOrderId) filter.workOrderId = workOrderId;
      if (type) filter.type = type;

      const txns = await InventoryTransaction.find(filter)
        .populate('materialId', 'name code category uom')
        .populate('workOrderId', 'orderNumber')
        .populate('performedBy', 'name email')
        .sort({ timestamp: -1 });

      res.json({ success: true, count: txns.length, transactions: txns });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
