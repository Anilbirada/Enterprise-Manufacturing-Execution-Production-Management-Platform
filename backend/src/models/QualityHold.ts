import mongoose, { Schema, Document } from 'mongoose';

export interface IQualityHold extends Document {
  plantId: mongoose.Types.ObjectId;
  holdNumber: string;
  entityType: 'WorkOrder' | 'Batch' | 'Machine' | 'ProductionLine';
  entityId: mongoose.Types.ObjectId;
  entityIdentifier: string; // e.g. "WO-2026-001" or "BATCH-8902"
  reason: string;
  placedBy: mongoose.Types.ObjectId;
  placedByName: string;
  placedAt: Date;
  status: 'Active' | 'Released';
  releasedBy?: mongoose.Types.ObjectId;
  releasedByName?: string;
  releasedAt?: Date;
  releaseJustification?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QualityHoldSchema = new Schema<IQualityHold>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    holdNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    entityType: {
      type: String,
      enum: ['WorkOrder', 'Batch', 'Machine', 'ProductionLine'],
      required: true,
      index: true
    },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    entityIdentifier: { type: String, required: true },
    reason: { type: String, required: true },
    placedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    placedByName: { type: String, required: true },
    placedAt: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ['Active', 'Released'],
      default: 'Active',
      index: true
    },
    releasedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    releasedByName: { type: String },
    releasedAt: { type: Date },
    releaseJustification: { type: String }
  },
  { timestamps: true }
);

export const QualityHold = mongoose.model<IQualityHold>('QualityHold', QualityHoldSchema);
