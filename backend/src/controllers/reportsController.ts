import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { ProductionEntry } from '../models/ProductionEntry';
import { WorkOrder } from '../models/WorkOrder';
import { DowntimeEvent } from '../models/DowntimeEvent';
import { Inspection } from '../models/Inspection';
import { ERPAdapter } from '../adapters/erpAdapter';
import mongoose from 'mongoose';

export class ReportsController {
  public static async getShiftReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { shiftId, date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const filter: any = {
        startTime: { $gte: startOfDay, $lte: endOfDay }
      };

      if (req.plantId) filter.plantId = new mongoose.Types.ObjectId(req.plantId);
      if (shiftId) filter.shiftId = new mongoose.Types.ObjectId(shiftId as string);

      const entries = await ProductionEntry.find(filter)
        .populate('workOrderId', 'orderNumber plannedQuantity completedQuantity')
        .populate('productId', 'name code uom')
        .populate('machineId', 'name code')
        .populate('shiftId', 'name code')
        .populate('operatorId', 'name email');

      const totalGood = entries.reduce((acc, e) => acc + e.goodQuantity, 0);
      const totalRejected = entries.reduce((acc, e) => acc + e.rejectedQuantity, 0);
      const totalProduced = totalGood + totalRejected;
      const totalMinutes = entries.reduce((acc, e) => acc + e.durationMinutes, 0);

      const reportData = {
        date: targetDate.toISOString().split('T')[0],
        totalEntries: entries.length,
        totalGood,
        totalRejected,
        totalProduced,
        scrapRatePercent: totalProduced > 0 ? Math.round((totalRejected / totalProduced) * 1000) / 10 : 0,
        totalOperatingMinutes: totalMinutes,
        entries
      };

      if (req.query.format === 'csv') {
        const flatRecords = entries.map((e: any) => ({
          Date: e.startTime.toISOString(),
          WorkOrder: e.workOrderId?.orderNumber || 'N/A',
          ProductCode: e.productId?.code || 'N/A',
          ProductName: e.productId?.name || 'N/A',
          Machine: e.machineId?.name || 'N/A',
          Shift: e.shiftId?.name || 'N/A',
          Operator: e.operatorId?.name || 'N/A',
          GoodQuantity: e.goodQuantity,
          RejectedQuantity: e.rejectedQuantity,
          DurationMinutes: e.durationMinutes,
          RejectionReason: e.rejectionReason || ''
        }));
        const csv = ERPAdapter.exportToCSV(flatRecords);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=shift-report-${targetDate.toISOString().split('T')[0]}.csv`);
        res.send(csv);
        return;
      }

      if (req.query.format === 'excel') {
        const flatRecords = entries.map((e: any) => ({
          Date: e.startTime.toISOString(),
          WorkOrder: e.workOrderId?.orderNumber || 'N/A',
          ProductCode: e.productId?.code || 'N/A',
          ProductName: e.productId?.name || 'N/A',
          Machine: e.machineId?.name || 'N/A',
          Shift: e.shiftId?.name || 'N/A',
          Operator: e.operatorId?.name || 'N/A',
          GoodQuantity: e.goodQuantity,
          RejectedQuantity: e.rejectedQuantity,
          DurationMinutes: e.durationMinutes,
          RejectionReason: e.rejectionReason || ''
        }));
        const excelBuffer = ERPAdapter.exportToExcel(flatRecords, 'ShiftReport');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=shift-report-${targetDate.toISOString().split('T')[0]}.xlsx`);
        res.send(excelBuffer);
        return;
      }

      res.json({ success: true, report: reportData });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getProductionSummaryReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : new Date(Date.now() - 7 * 86400000);
      const toDate = req.query.toDate ? new Date(req.query.toDate as string) : new Date();

      const filter: any = {
        startTime: { $gte: fromDate, $lte: toDate }
      };
      if (req.plantId) filter.plantId = new mongoose.Types.ObjectId(req.plantId);

      const entries = await ProductionEntry.find(filter)
        .populate('productId', 'name code')
        .populate('machineId', 'name code')
        .populate('workOrderId', 'orderNumber');

      const byProduct: Record<string, { product: string; code: string; good: number; rejected: number; total: number }> = {};
      for (const e of entries as any[]) {
        const code = e.productId?.code || 'UNKNOWN';
        if (!byProduct[code]) {
          byProduct[code] = {
            product: e.productId?.name || 'Unknown',
            code,
            good: 0,
            rejected: 0,
            total: 0
          };
        }
        byProduct[code].good += e.goodQuantity;
        byProduct[code].rejected += e.rejectedQuantity;
        byProduct[code].total += (e.goodQuantity + e.rejectedQuantity);
      }

      res.json({
        success: true,
        period: { from: fromDate, to: toDate },
        totalEntries: entries.length,
        productBreakdown: Object.values(byProduct)
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
