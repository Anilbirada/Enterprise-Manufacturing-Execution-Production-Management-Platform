import mongoose, { Schema, Document } from 'mongoose';
import { MachineState } from '../config/constants';

export interface IMachine extends Document {
  plantId: mongoose.Types.ObjectId;
  productionLineId?: mongoose.Types.ObjectId;
  workstationId?: mongoose.Types.ObjectId;
  code: string; // Machine ID
  name: string;
  type: string;
  manufacturer?: string;
  serialNumber?: string;
  capacityUnitsPerHour: number;
  idealCycleTimeSeconds: number; // For performance OEE calculation
  state: MachineState;
  connectivityType: 'Manual' | 'Simulated' | 'OPC_UA' | 'MQTT';
  lastStateChange: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  operatingHoursTotal: number;
  currentWorkOrderId?: mongoose.Types.ObjectId;
  currentOperatorId?: mongoose.Types.ObjectId;
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MachineSchema = new Schema<IMachine>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    productionLineId: { type: Schema.Types.ObjectId, ref: 'ProductionLine', index: true },
    workstationId: { type: Schema.Types.ObjectId, ref: 'Workstation' },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true },
    manufacturer: { type: String },
    serialNumber: { type: String },
    capacityUnitsPerHour: { type: Number, default: 60, min: 1 },
    idealCycleTimeSeconds: { type: Number, default: 60, min: 0.1 },
    state: {
      type: String,
      enum: Object.values(MachineState),
      default: MachineState.IDLE,
      index: true
    },
    connectivityType: {
      type: String,
      enum: ['Manual', 'Simulated', 'OPC_UA', 'MQTT'],
      default: 'Manual'
    },
    lastStateChange: { type: Date, default: Date.now },
    lastMaintenanceDate: { type: Date },
    nextMaintenanceDate: { type: Date },
    operatingHoursTotal: { type: Number, default: 0 },
    currentWorkOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
    currentOperatorId: { type: Schema.Types.ObjectId, ref: 'User' },
    active: { type: Boolean, default: true, index: true },
    notes: { type: String }
  },
  { timestamps: true }
);

export const Machine = mongoose.model<IMachine>('Machine', MachineSchema);
