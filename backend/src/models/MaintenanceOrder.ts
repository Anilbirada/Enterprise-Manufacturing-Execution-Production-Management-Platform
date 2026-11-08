import mongoose, { Schema, Document } from 'mongoose';
import { MaintenanceType, MaintenanceStatus } from '../config/constants';

export interface ISparePartUsed {
  materialId?: mongoose.Types.ObjectId;
  partName: string;
  quantity: number;
  cost?: number;
}

export interface IMaintenanceOrder extends Document {
  plantId: mongoose.Types.ObjectId;
  orderNumber: string;
  machineId: mongoose.Types.ObjectId;
  type: MaintenanceType;
  status: MaintenanceStatus;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  title: string;
  description: string;
  scheduledDate: Date;
  startDate?: Date;
  completionDate?: Date;
  assignedTechnicianId?: mongoose.Types.ObjectId;
  actionsTaken?: string;
  downtimeDurationMinutes: number;
  spareParts: ISparePartUsed[];
  totalCost?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SparePartSchema = new Schema<ISparePartUsed>({
  materialId: { type: Schema.Types.ObjectId, ref: 'Material' },
  partName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  cost: { type: Number, default: 0 }
});

const MaintenanceOrderSchema = new Schema<IMaintenanceOrder>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    orderNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    machineId: { type: Schema.Types.ObjectId, ref: 'Machine', required: true, index: true },
    type: {
      type: String,
      enum: Object.values(MaintenanceType),
      default: MaintenanceType.PREVENTIVE,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(MaintenanceStatus),
      default: MaintenanceStatus.SCHEDULED,
      index: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Emergency'],
      default: 'Medium'
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    scheduledDate: { type: Date, required: true, index: true },
    startDate: { type: Date },
    completionDate: { type: Date },
    assignedTechnicianId: { type: Schema.Types.ObjectId, ref: 'User' },
    actionsTaken: { type: String },
    downtimeDurationMinutes: { type: Number, default: 0, min: 0 },
    spareParts: [SparePartSchema],
    totalCost: { type: Number, default: 0 },
    notes: { type: String }
  },
  { timestamps: true }
);

export const MaintenanceOrder = mongoose.model<IMaintenanceOrder>('MaintenanceOrder', MaintenanceOrderSchema);
