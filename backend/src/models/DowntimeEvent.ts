import mongoose, { Schema, Document } from 'mongoose';
import { DowntimeCategory } from '../config/constants';

export interface IDowntimeEvent extends Document {
  plantId: mongoose.Types.ObjectId;
  machineId: mongoose.Types.ObjectId;
  productionLineId?: mongoose.Types.ObjectId;
  workOrderId?: mongoose.Types.ObjectId;
  shiftId?: mongoose.Types.ObjectId;
  category: DowntimeCategory;
  isPlanned: boolean; // Planned vs unplanned downtime
  reasonCode?: string;
  reasonDescription: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  reportedBy: mongoose.Types.ObjectId;
  resolvedBy?: mongoose.Types.ObjectId;
  resolutionRemarks?: string;
  active: boolean; // true if machine is still currently down
  createdAt: Date;
  updatedAt: Date;
}

const DowntimeEventSchema = new Schema<IDowntimeEvent>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    machineId: { type: Schema.Types.ObjectId, ref: 'Machine', required: true, index: true },
    productionLineId: { type: Schema.Types.ObjectId, ref: 'ProductionLine', index: true },
    workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder', index: true },
    shiftId: { type: Schema.Types.ObjectId, ref: 'Shift', index: true },
    category: {
      type: String,
      enum: Object.values(DowntimeCategory),
      required: true,
      index: true
    },
    isPlanned: { type: Boolean, default: false, index: true },
    reasonCode: { type: String },
    reasonDescription: { type: String, required: true },
    startTime: { type: Date, required: true, default: Date.now, index: true },
    endTime: { type: Date, index: true },
    durationMinutes: { type: Number, min: 0 },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolutionRemarks: { type: String },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export const DowntimeEvent = mongoose.model<IDowntimeEvent>('DowntimeEvent', DowntimeEventSchema);
