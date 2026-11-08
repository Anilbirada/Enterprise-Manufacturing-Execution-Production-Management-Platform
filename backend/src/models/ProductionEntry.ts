import mongoose, { Schema, Document } from 'mongoose';

export interface IProductionEntry extends Document {
  plantId: mongoose.Types.ObjectId;
  workOrderId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productionLineId: mongoose.Types.ObjectId;
  machineId: mongoose.Types.ObjectId;
  shiftId: mongoose.Types.ObjectId;
  operatorId: mongoose.Types.ObjectId;
  operationSequence: number;
  goodQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;
  rejectionReason?: string;
  defectCategory?: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  notes?: string;
  idempotencyKey?: string; // Prevent duplicate operator submissions
  isCorrection: boolean;
  correctedEntryId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductionEntrySchema = new Schema<IProductionEntry>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productionLineId: { type: Schema.Types.ObjectId, ref: 'ProductionLine', required: true, index: true },
    machineId: { type: Schema.Types.ObjectId, ref: 'Machine', required: true, index: true },
    shiftId: { type: Schema.Types.ObjectId, ref: 'Shift', required: true, index: true },
    operatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    operationSequence: { type: Number, default: 10 },
    goodQuantity: { type: Number, required: true, min: 0 },
    rejectedQuantity: { type: Number, default: 0, min: 0 },
    reworkQuantity: { type: Number, default: 0, min: 0 },
    rejectionReason: { type: String },
    defectCategory: { type: String },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, required: true, min: 0 },
    notes: { type: String },
    idempotencyKey: { type: String, unique: true, sparse: true, index: true },
    isCorrection: { type: Boolean, default: false },
    correctedEntryId: { type: Schema.Types.ObjectId, ref: 'ProductionEntry' }
  },
  { timestamps: true }
);

export const ProductionEntry = mongoose.model<IProductionEntry>('ProductionEntry', ProductionEntrySchema);
