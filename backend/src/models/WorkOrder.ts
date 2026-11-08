import mongoose, { Schema, Document } from 'mongoose';
import { WorkOrderStatus } from '../config/constants';

export interface IWorkOrderHistory {
  fromStatus: WorkOrderStatus;
  toStatus: WorkOrderStatus;
  changedBy: mongoose.Types.ObjectId;
  changedByName: string;
  timestamp: Date;
  reason?: string;
}

export interface IWorkOrder extends Document {
  orderNumber: string;
  plantId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  routingId?: mongoose.Types.ObjectId;
  productionLineId?: mongoose.Types.ObjectId;
  shiftId?: mongoose.Types.ObjectId;
  supervisorId?: mongoose.Types.ObjectId;
  assignedOperatorId?: mongoose.Types.ObjectId;
  plannedQuantity: number;
  completedQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: WorkOrderStatus;
  currentOperationSequence: number;
  startDatePlanned: Date;
  dueDate: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  batchNumber?: string;
  isQualityHold: boolean;
  qualityHoldReason?: string;
  instructions?: string;
  history: IWorkOrderHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkOrderHistorySchema = new Schema<IWorkOrderHistory>({
  fromStatus: { type: String, enum: Object.values(WorkOrderStatus), required: true },
  toStatus: { type: String, enum: Object.values(WorkOrderStatus), required: true },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  changedByName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  reason: { type: String }
});

const WorkOrderSchema = new Schema<IWorkOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    routingId: { type: Schema.Types.ObjectId, ref: 'Routing' },
    productionLineId: { type: Schema.Types.ObjectId, ref: 'ProductionLine', index: true },
    shiftId: { type: Schema.Types.ObjectId, ref: 'Shift', index: true },
    supervisorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    assignedOperatorId: { type: Schema.Types.ObjectId, ref: 'User' },
    plannedQuantity: { type: Number, required: true, min: 1 },
    completedQuantity: { type: Number, default: 0, min: 0 },
    rejectedQuantity: { type: Number, default: 0, min: 0 },
    reworkQuantity: { type: Number, default: 0, min: 0 },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
      index: true
    },
    status: {
      type: String,
      enum: Object.values(WorkOrderStatus),
      default: WorkOrderStatus.DRAFT,
      index: true
    },
    currentOperationSequence: { type: Number, default: 10 },
    startDatePlanned: { type: Date, required: true, index: true },
    dueDate: { type: Date, required: true, index: true },
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },
    batchNumber: { type: String, trim: true, index: true },
    isQualityHold: { type: Boolean, default: false, index: true },
    qualityHoldReason: { type: String },
    instructions: { type: String },
    history: [WorkOrderHistorySchema]
  },
  { timestamps: true }
);

export const WorkOrder = mongoose.model<IWorkOrder>('WorkOrder', WorkOrderSchema);
