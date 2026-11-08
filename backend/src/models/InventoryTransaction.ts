import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryTransaction extends Document {
  plantId: mongoose.Types.ObjectId;
  materialId: mongoose.Types.ObjectId;
  type: 'RECEIVE' | 'ISSUE_TO_PRODUCTION' | 'CONSUMPTION' | 'RETURN' | 'SCRAP' | 'ADJUSTMENT';
  quantity: number;
  balanceAfter: number;
  workOrderId?: mongoose.Types.ObjectId;
  batchNumber?: string;
  lotNumber?: string;
  referenceDoc?: string;
  reason?: string;
  performedBy: mongoose.Types.ObjectId;
  timestamp: Date;
  createdAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true, index: true },
    type: {
      type: String,
      enum: ['RECEIVE', 'ISSUE_TO_PRODUCTION', 'CONSUMPTION', 'RETURN', 'SCRAP', 'ADJUSTMENT'],
      required: true,
      index: true
    },
    quantity: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder', index: true },
    batchNumber: { type: String, trim: true },
    lotNumber: { type: String, trim: true },
    referenceDoc: { type: String },
    reason: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

export const InventoryTransaction = mongoose.model<IInventoryTransaction>('InventoryTransaction', InventoryTransactionSchema);
