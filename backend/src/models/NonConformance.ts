import mongoose, { Schema, Document } from 'mongoose';

export interface INonConformance extends Document {
  plantId: mongoose.Types.ObjectId;
  ncrNumber: string;
  inspectionId?: mongoose.Types.ObjectId;
  workOrderId?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  batchNumber?: string;
  defectCategory: string;
  defectDescription: string;
  quantityAffected: number;
  rootCauseAnalysis?: string;
  containmentAction?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  status: 'Open' | 'Under Investigation' | 'CAPA Pending' | 'Closed';
  reportedBy: mongoose.Types.ObjectId;
  assignedQualityEngineerId?: mongoose.Types.ObjectId;
  targetResolutionDate?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NonConformanceSchema = new Schema<INonConformance>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    ncrNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    inspectionId: { type: Schema.Types.ObjectId, ref: 'Inspection' },
    workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder', index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    batchNumber: { type: String, index: true },
    defectCategory: { type: String, required: true },
    defectDescription: { type: String, required: true },
    quantityAffected: { type: Number, required: true, min: 1 },
    rootCauseAnalysis: { type: String },
    containmentAction: { type: String },
    correctiveAction: { type: String },
    preventiveAction: { type: String },
    status: {
      type: String,
      enum: ['Open', 'Under Investigation', 'CAPA Pending', 'Closed'],
      default: 'Open',
      index: true
    },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedQualityEngineerId: { type: Schema.Types.ObjectId, ref: 'User' },
    targetResolutionDate: { type: Date },
    closedAt: { type: Date }
  },
  { timestamps: true }
);

export const NonConformance = mongoose.model<INonConformance>('NonConformance', NonConformanceSchema);
