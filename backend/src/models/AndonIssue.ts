import mongoose, { Schema, Document } from 'mongoose';
import { AndonStatus, AndonSeverity, DowntimeCategory } from '../config/constants';

export interface IAndonIssue extends Document {
  plantId: mongoose.Types.ObjectId;
  issueNumber: string;
  productionLineId: mongoose.Types.ObjectId;
  machineId?: mongoose.Types.ObjectId;
  workOrderId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: DowntimeCategory;
  severity: AndonSeverity;
  status: AndonStatus;
  reportedBy: mongoose.Types.ObjectId;
  acknowledgedBy?: mongoose.Types.ObjectId;
  resolvedBy?: mongoose.Types.ObjectId;
  assignedEngineerId?: mongoose.Types.ObjectId;
  reportedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  resolutionNotes?: string;
  isEscalated: boolean;
  escalatedAt?: Date;
  escalationLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

const AndonIssueSchema = new Schema<IAndonIssue>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    issueNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    productionLineId: { type: Schema.Types.ObjectId, ref: 'ProductionLine', required: true, index: true },
    machineId: { type: Schema.Types.ObjectId, ref: 'Machine', index: true },
    workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: Object.values(DowntimeCategory),
      default: DowntimeCategory.MECHANICAL_FAILURE
    },
    severity: {
      type: String,
      enum: Object.values(AndonSeverity),
      default: AndonSeverity.MEDIUM,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(AndonStatus),
      default: AndonStatus.OPEN,
      index: true
    },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedEngineerId: { type: Schema.Types.ObjectId, ref: 'User' },
    reportedAt: { type: Date, default: Date.now },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    resolutionNotes: { type: String },
    isEscalated: { type: Boolean, default: false, index: true },
    escalatedAt: { type: Date },
    escalationLevel: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const AndonIssue = mongoose.model<IAndonIssue>('AndonIssue', AndonIssueSchema);
