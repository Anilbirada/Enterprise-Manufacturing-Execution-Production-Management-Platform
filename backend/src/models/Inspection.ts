import mongoose, { Schema, Document } from 'mongoose';
import { InspectionType, QualityDisposition } from '../config/constants';

export interface IInspectionParameterResult {
  parameterName: string;
  nominalValue?: number;
  actualValue?: string;
  passed: boolean;
  remarks?: string;
}

export interface IInspection extends Document {
  plantId: mongoose.Types.ObjectId;
  inspectionNumber: string;
  qualityPlanId?: mongoose.Types.ObjectId;
  workOrderId?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  batchNumber?: string;
  machineId?: mongoose.Types.ObjectId;
  operationSequence?: number;
  inspectionType: InspectionType;
  sampleSize: number;
  inspectedQuantity: number;
  passedQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;
  disposition: QualityDisposition;
  defectReason?: string;
  parameterResults: IInspectionParameterResult[];
  inspectorId: mongoose.Types.ObjectId;
  inspectedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParameterResultSchema = new Schema<IInspectionParameterResult>({
  parameterName: { type: String, required: true },
  nominalValue: { type: Number },
  actualValue: { type: String },
  passed: { type: Boolean, required: true },
  remarks: { type: String }
});

const InspectionSchema = new Schema<IInspection>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    inspectionNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    qualityPlanId: { type: Schema.Types.ObjectId, ref: 'QualityPlan' },
    workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder', index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    batchNumber: { type: String, trim: true, index: true },
    machineId: { type: Schema.Types.ObjectId, ref: 'Machine' },
    operationSequence: { type: Number },
    inspectionType: {
      type: String,
      enum: Object.values(InspectionType),
      required: true,
      index: true
    },
    sampleSize: { type: Number, default: 5 },
    inspectedQuantity: { type: Number, required: true, min: 1 },
    passedQuantity: { type: Number, required: true, min: 0 },
    rejectedQuantity: { type: Number, default: 0, min: 0 },
    reworkQuantity: { type: Number, default: 0, min: 0 },
    disposition: {
      type: String,
      enum: Object.values(QualityDisposition),
      default: QualityDisposition.PENDING,
      index: true
    },
    defectReason: { type: String },
    parameterResults: [ParameterResultSchema],
    inspectorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    inspectedAt: { type: Date, default: Date.now, index: true },
    notes: { type: String }
  },
  { timestamps: true }
);

export const Inspection = mongoose.model<IInspection>('Inspection', InspectionSchema);
