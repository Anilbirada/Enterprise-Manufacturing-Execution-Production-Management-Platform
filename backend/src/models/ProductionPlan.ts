import mongoose, { Schema, Document } from 'mongoose';

export interface IPlannedOrderItem {
  workOrderId: mongoose.Types.ObjectId;
  productionLineId: mongoose.Types.ObjectId;
  shiftId: mongoose.Types.ObjectId;
  scheduledStart: Date;
  scheduledEnd: Date;
  plannedQuantity: number;
  sequenceOrder: number;
}

export interface IProductionPlan extends Document {
  plantId: mongoose.Types.ObjectId;
  planNumber: string;
  title: string;
  periodStart: Date;
  periodEnd: Date;
  status: 'Draft' | 'Approved' | 'In Progress' | 'Completed';
  items: IPlannedOrderItem[];
  createdBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlannedOrderItemSchema = new Schema<IPlannedOrderItem>({
  workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  productionLineId: { type: Schema.Types.ObjectId, ref: 'ProductionLine', required: true },
  shiftId: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
  scheduledStart: { type: Date, required: true },
  scheduledEnd: { type: Date, required: true },
  plannedQuantity: { type: Number, required: true },
  sequenceOrder: { type: Number, default: 1 }
});

const ProductionPlanSchema = new Schema<IProductionPlan>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    planNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true },
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['Draft', 'Approved', 'In Progress', 'Completed'],
      default: 'Draft',
      index: true
    },
    items: [PlannedOrderItemSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String }
  },
  { timestamps: true }
);

export const ProductionPlan = mongoose.model<IProductionPlan>('ProductionPlan', ProductionPlanSchema);
