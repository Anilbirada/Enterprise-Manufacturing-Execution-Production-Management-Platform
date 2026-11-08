import mongoose, { Schema, Document } from 'mongoose';

export interface IBatch extends Document {
  plantId: mongoose.Types.ObjectId;
  batchNumber: string;
  workOrderId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  plannedQuantity: number;
  actualQuantity: number;
  rejectedQuantity: number;
  manufacturedDate: Date;
  expiryDate?: Date;
  status: 'In Production' | 'Quality Inspection' | 'Released' | 'On Hold' | 'Quarantine' | 'Scrapped';
  serialNumbers: string[];
  rawMaterialLots: { materialCode: string; lotNumber: string }[];
  qrCodeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    batchNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    plannedQuantity: { type: Number, required: true },
    actualQuantity: { type: Number, default: 0 },
    rejectedQuantity: { type: Number, default: 0 },
    manufacturedDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    status: {
      type: String,
      enum: ['In Production', 'Quality Inspection', 'Released', 'On Hold', 'Quarantine', 'Scrapped'],
      default: 'In Production',
      index: true
    },
    serialNumbers: { type: [String], default: [] },
    rawMaterialLots: [
      {
        materialCode: { type: String, required: true },
        lotNumber: { type: String, required: true }
      }
    ],
    qrCodeUrl: { type: String }
  },
  { timestamps: true }
);

export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);
