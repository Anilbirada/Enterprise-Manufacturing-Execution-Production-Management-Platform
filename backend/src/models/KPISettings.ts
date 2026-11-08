import mongoose, { Schema, Document } from 'mongoose';

export interface IKPISettings extends Document {
  plantId: mongoose.Types.ObjectId;
  formulaVersion: string;
  excludePlannedBreaks: boolean;
  excludePlannedMaintenanceFromUnplannedDowntime: boolean;
  availabilityTargetPercent: number;
  performanceTargetPercent: number;
  qualityTargetPercent: number;
  oeeTargetPercent: number;
  minDataThresholdMinutes: number; // Disallow misleading calculations if data is below threshold
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const KPISettingsSchema = new Schema<IKPISettings>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, unique: true, index: true },
    formulaVersion: { type: String, default: '1.0' },
    excludePlannedBreaks: { type: Boolean, default: true },
    excludePlannedMaintenanceFromUnplannedDowntime: { type: Boolean, default: true },
    availabilityTargetPercent: { type: Number, default: 90 },
    performanceTargetPercent: { type: Number, default: 95 },
    qualityTargetPercent: { type: Number, default: 99 },
    oeeTargetPercent: { type: Number, default: 85 },
    minDataThresholdMinutes: { type: Number, default: 15 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const KPISettings = mongoose.model<IKPISettings>('KPISettings', KPISettingsSchema);
