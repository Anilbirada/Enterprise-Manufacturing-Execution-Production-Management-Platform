import mongoose, { Schema, Document } from 'mongoose';

export interface IOperationStep {
  sequence: number; // e.g. 10, 20, 30...
  name: string;
  description?: string;
  workstationId?: mongoose.Types.ObjectId;
  machineType?: string;
  cycleTimeSeconds: number;
  setupTimeMinutes: number;
  requiresQualityInspection: boolean;
  workInstructionId?: mongoose.Types.ObjectId;
}

export interface IRouting extends Document {
  plantId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  code: string;
  name: string;
  version: string;
  active: boolean;
  operations: IOperationStep[];
  createdAt: Date;
  updatedAt: Date;
}

const OperationStepSchema = new Schema<IOperationStep>({
  sequence: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String },
  workstationId: { type: Schema.Types.ObjectId, ref: 'Workstation' },
  machineType: { type: String },
  cycleTimeSeconds: { type: Number, default: 60, min: 1 },
  setupTimeMinutes: { type: Number, default: 15, min: 0 },
  requiresQualityInspection: { type: Boolean, default: false },
  workInstructionId: { type: Schema.Types.ObjectId, ref: 'WorkInstruction' }
});

const RoutingSchema = new Schema<IRouting>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true },
    version: { type: String, default: '1.0' },
    active: { type: Boolean, default: true, index: true },
    operations: [OperationStepSchema]
  },
  { timestamps: true }
);

RoutingSchema.index({ plantId: 1, productId: 1, code: 1 }, { unique: true });

export const Routing = mongoose.model<IRouting>('Routing', RoutingSchema);
