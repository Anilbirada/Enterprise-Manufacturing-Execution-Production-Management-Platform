import { ProductionEntry } from '../models/ProductionEntry';
import { DowntimeEvent } from '../models/DowntimeEvent';
import { Shift } from '../models/Shift';
import { Machine } from '../models/Machine';
import { KPISettings } from '../models/KPISettings';
import mongoose from 'mongoose';

export interface OEEResult {
  scope: 'machine' | 'line' | 'shift' | 'overall';
  scopeId?: string;
  name?: string;
  periodStart: Date;
  periodEnd: Date;
  plannedProductionMinutes: number;
  operatingMinutes: number;
  unplannedDowntimeMinutes: number;
  plannedBreakMinutes: number;
  totalProductionCount: number;
  goodQuantity: number;
  rejectedQuantity: number;
  idealCycleTimeSeconds: number;
  availabilityPercent: number | null;
  performancePercent: number | null;
  qualityPercent: number | null;
  oeePercent: number | null;
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'WARNING' | 'CRITICAL' | 'NO_DATA';
  hasSufficientData: boolean;
  formulaVersion: string;
}

export class OEEService {
  /**
   * Pure calculation helper for unit testing & verified math
   */
  public static calculateOEEFromMetrics(params: {
    plannedProductionMinutes: number;
    unplannedDowntimeMinutes: number;
    goodQuantity: number;
    rejectedQuantity: number;
    idealCycleTimeSeconds: number;
  }): {
    operatingMinutes: number;
    availability: number | null;
    performance: number | null;
    quality: number | null;
    oee: number | null;
  } {
    const {
      plannedProductionMinutes,
      unplannedDowntimeMinutes,
      goodQuantity,
      rejectedQuantity,
      idealCycleTimeSeconds
    } = params;

    if (plannedProductionMinutes <= 0) {
      return {
        operatingMinutes: 0,
        availability: null,
        performance: null,
        quality: null,
        oee: null
      };
    }

    const operatingMinutes = Math.max(0, plannedProductionMinutes - unplannedDowntimeMinutes);
    const totalCount = goodQuantity + rejectedQuantity;

    // Availability = Operating Time / Planned Production Time
    const availability = (operatingMinutes / plannedProductionMinutes) * 100;

    // Performance = (Ideal Cycle Time × Total Count) / Operating Time
    // (idealCycleTimeSeconds * totalCount) / (operatingMinutes * 60)
    let performance: number | null = null;
    if (operatingMinutes > 0) {
      const operatingSeconds = operatingMinutes * 60;
      performance = ((idealCycleTimeSeconds * totalCount) / operatingSeconds) * 100;
      // Cap at 100% or allow slightly higher if running faster, but realistically cap at 120%
      if (performance > 120) performance = 120;
    }

    // Quality = Good Quantity / Total Quantity
    let quality: number | null = null;
    if (totalCount > 0) {
      quality = (goodQuantity / totalCount) * 100;
    } else if (operatingMinutes > 0) {
      // Operating with 0 pieces produced
      quality = 0;
    }

    // OEE = A * P * Q
    let oee: number | null = null;
    if (availability !== null && performance !== null && quality !== null) {
      oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;
      oee = Math.round(oee * 100) / 100;
    }

    return {
      operatingMinutes: Math.round(operatingMinutes * 10) / 10,
      availability: availability !== null ? Math.round(availability * 100) / 100 : null,
      performance: performance !== null ? Math.round(performance * 100) / 100 : null,
      quality: quality !== null ? Math.round(quality * 100) / 100 : null,
      oee
    };
  }

  /**
   * Calculate OEE for a specific machine in a given date range
   */
  public static async calculateMachineOEE(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<OEEResult> {
    const machine = await Machine.findById(machineId);
    if (!machine) {
      throw new Error(`Machine with ID ${machineId} not found.`);
    }

    const kpiConfig = await KPISettings.findOne({ plantId: machine.plantId }) || {
      formulaVersion: '1.0',
      excludePlannedBreaks: true,
      excludePlannedMaintenanceFromUnplannedDowntime: true,
      minDataThresholdMinutes: 15
    };

    // Calculate total duration in minutes
    const totalMinutes = Math.max(0, (endDate.getTime() - startDate.getTime()) / (1000 * 60));

    // Get shifts applicable to this plant to deduct planned breaks
    const shifts = await Shift.find({ plantId: machine.plantId, active: true });
    let plannedBreakMinutes = 0;
    if (kpiConfig.excludePlannedBreaks && shifts.length > 0) {
      // Calculate fraction of breaks corresponding to total minutes
      const avgShiftBreaks = shifts.reduce((acc, s) => acc + (s.plannedBreakMinutes || 0), 0) / shifts.length;
      const numShifts = totalMinutes / 480;
      plannedBreakMinutes = Math.min(totalMinutes * 0.2, avgShiftBreaks * Math.max(1, numShifts));
    }

    const plannedProductionMinutes = Math.max(0, totalMinutes - plannedBreakMinutes);

    // Sum unplanned downtime events
    const downtimeEvents = await DowntimeEvent.find({
      machineId: machine._id,
      isPlanned: false,
      startTime: { $gte: startDate, $lte: endDate }
    });

    const unplannedDowntimeMinutes = downtimeEvents.reduce((acc, ev) => {
      if (ev.durationMinutes !== undefined && ev.durationMinutes !== null) {
        return acc + ev.durationMinutes;
      }
      if (ev.endTime) {
        return acc + (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 60);
      }
      // Ongoing downtime
      return acc + (Date.now() - ev.startTime.getTime()) / (1000 * 60);
    }, 0);

    // Sum production entries
    const entries = await ProductionEntry.find({
      machineId: machine._id,
      startTime: { $gte: startDate, $lte: endDate }
    });

    const goodQuantity = entries.reduce((acc, e) => acc + (e.goodQuantity || 0), 0);
    const rejectedQuantity = entries.reduce((acc, e) => acc + (e.rejectedQuantity || 0), 0);
    const totalCount = goodQuantity + rejectedQuantity;

    const idealCycleTimeSeconds = machine.idealCycleTimeSeconds || 60;

    const calc = this.calculateOEEFromMetrics({
      plannedProductionMinutes,
      unplannedDowntimeMinutes,
      goodQuantity,
      rejectedQuantity,
      idealCycleTimeSeconds
    });

    const hasSufficientData = totalMinutes >= kpiConfig.minDataThresholdMinutes && (totalCount > 0 || calc.operatingMinutes > 0);

    let status: OEEResult['status'] = 'NO_DATA';
    if (calc.oee !== null) {
      if (calc.oee >= 85) status = 'OPTIMAL';
      else if (calc.oee >= 70) status = 'ACCEPTABLE';
      else if (calc.oee >= 50) status = 'WARNING';
      else status = 'CRITICAL';
    }

    return {
      scope: 'machine',
      scopeId: machine._id.toString(),
      name: machine.name,
      periodStart: startDate,
      periodEnd: endDate,
      plannedProductionMinutes: Math.round(plannedProductionMinutes),
      operatingMinutes: calc.operatingMinutes,
      unplannedDowntimeMinutes: Math.round(unplannedDowntimeMinutes),
      plannedBreakMinutes: Math.round(plannedBreakMinutes),
      totalProductionCount: totalCount,
      goodQuantity,
      rejectedQuantity,
      idealCycleTimeSeconds,
      availabilityPercent: calc.availability,
      performancePercent: calc.performance,
      qualityPercent: calc.quality,
      oeePercent: calc.oee,
      status,
      hasSufficientData,
      formulaVersion: kpiConfig.formulaVersion
    };
  }

  /**
   * Calculate Plant-wide or Line OEE
   */
  public static async calculatePlantOEE(
    plantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<OEEResult> {
    const machines = await Machine.find({ plantId: new mongoose.Types.ObjectId(plantId), active: true });
    if (machines.length === 0) {
      return {
        scope: 'overall',
        periodStart: startDate,
        periodEnd: endDate,
        plannedProductionMinutes: 0,
        operatingMinutes: 0,
        unplannedDowntimeMinutes: 0,
        plannedBreakMinutes: 0,
        totalProductionCount: 0,
        goodQuantity: 0,
        rejectedQuantity: 0,
        idealCycleTimeSeconds: 60,
        availabilityPercent: null,
        performancePercent: null,
        qualityPercent: null,
        oeePercent: null,
        status: 'NO_DATA',
        hasSufficientData: false,
        formulaVersion: '1.0'
      };
    }

    const machineOEEs = await Promise.all(
      machines.map((m) => this.calculateMachineOEE(m._id.toString(), startDate, endDate))
    );

    const validOEEs = machineOEEs.filter((m) => m.oeePercent !== null);
    const avgAvailability =
      machineOEEs.reduce((acc, m) => acc + (m.availabilityPercent || 0), 0) / (machineOEEs.length || 1);
    const avgPerformance =
      machineOEEs.reduce((acc, m) => acc + (m.performancePercent || 0), 0) / (machineOEEs.length || 1);
    const avgQuality =
      machineOEEs.reduce((acc, m) => acc + (m.qualityPercent || 0), 0) / (machineOEEs.length || 1);

    const avgOEE =
      validOEEs.length > 0
        ? validOEEs.reduce((acc, m) => acc + (m.oeePercent || 0), 0) / validOEEs.length
        : null;

    const totalGood = machineOEEs.reduce((acc, m) => acc + m.goodQuantity, 0);
    const totalRejected = machineOEEs.reduce((acc, m) => acc + m.rejectedQuantity, 0);
    const totalDowntime = machineOEEs.reduce((acc, m) => acc + m.unplannedDowntimeMinutes, 0);
    const totalPlanned = machineOEEs.reduce((acc, m) => acc + m.plannedProductionMinutes, 0);
    const totalOperating = machineOEEs.reduce((acc, m) => acc + m.operatingMinutes, 0);

    let status: OEEResult['status'] = 'NO_DATA';
    if (avgOEE !== null) {
      if (avgOEE >= 85) status = 'OPTIMAL';
      else if (avgOEE >= 70) status = 'ACCEPTABLE';
      else if (avgOEE >= 50) status = 'WARNING';
      else status = 'CRITICAL';
    }

    return {
      scope: 'overall',
      periodStart: startDate,
      periodEnd: endDate,
      plannedProductionMinutes: Math.round(totalPlanned),
      operatingMinutes: Math.round(totalOperating),
      unplannedDowntimeMinutes: Math.round(totalDowntime),
      plannedBreakMinutes: 0,
      totalProductionCount: totalGood + totalRejected,
      goodQuantity: totalGood,
      rejectedQuantity: totalRejected,
      idealCycleTimeSeconds: 60,
      availabilityPercent: Math.round(avgAvailability * 100) / 100,
      performancePercent: Math.round(avgPerformance * 100) / 100,
      qualityPercent: Math.round(avgQuality * 100) / 100,
      oeePercent: avgOEE !== null ? Math.round(avgOEE * 100) / 100 : null,
      status,
      hasSufficientData: validOEEs.length > 0,
      formulaVersion: '1.0'
    };
  }
}
