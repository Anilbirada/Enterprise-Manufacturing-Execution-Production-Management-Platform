import mongoose, { Schema, Document } from 'mongoose';

export interface IProductionLine extends Document {
  plantId: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  code: string;
  name: string;
  description?: string;
  status: 'Active' | 'Maintenance' | 'Down' | 'Idle';
  targetPerHour: number;
  capacityPerShift: number;
  currentWorkOrderId?: mongoose.Types.ObjectId;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductionLineSchema = new Schema<IProductionLine>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['Active', 'Maintenance', 'Down', 'Idle'],
      default: 'Active',
      index: true
    },
    targetPerHour: { type: Number, default: 100 },
    capacityPerShift: { type: Number, default: 800 },
    currentWorkOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

ProductionLineSchema.index({ plantId: 1, code: 1 }, { unique: true });

export const ProductionLine = mongoose.model<IProductionLine>('ProductionLine', ProductionLineSchema);
