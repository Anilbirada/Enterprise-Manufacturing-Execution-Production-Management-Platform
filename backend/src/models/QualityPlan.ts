import mongoose, { Schema, Document } from 'mongoose';
import { InspectionType } from '../config/constants';

export interface IInspectionParameter {
  name: string;
  type: 'Numeric' | 'Visual' | 'PassFail';
  uom?: string;
  nominalValue?: number;
  minTolerance?: number;
  maxTolerance?: number;
  sampleSize: number;
  isMandatory: boolean;
}

export interface IQualityPlan extends Document {
  plantId: mongoose.Types.ObjectId;
  code: string;
  name: string;
  productId: mongoose.Types.ObjectId;
  inspectionType: InspectionType;
  parameters: IInspectionParameter[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InspectionParameterSchema = new Schema<IInspectionParameter>({
  name: { type: String, required: true },
  type: { type: String, enum: ['Numeric', 'Visual', 'PassFail'], default: 'PassFail' },
  uom: { type: String },
  nominalValue: { type: Number },
  minTolerance: { type: Number },
  maxTolerance: { type: Number },
  sampleSize: { type: Number, default: 5 },
  isMandatory: { type: Boolean, default: true }
});

const QualityPlanSchema = new Schema<IQualityPlan>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    inspectionType: {
      type: String,
      enum: Object.values(InspectionType),
      required: true,
      index: true
    },
    parameters: [InspectionParameterSchema],
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

QualityPlanSchema.index({ plantId: 1, productId: 1, inspectionType: 1 }, { unique: true });

export const QualityPlan = mongoose.model<IQualityPlan>('QualityPlan', QualityPlanSchema);
