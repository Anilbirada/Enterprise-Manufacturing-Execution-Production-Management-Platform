import mongoose, { Schema, Document } from 'mongoose';

export interface ITraceabilityEvent extends Document {
  plantId: mongoose.Types.ObjectId;
  trackingCode: string; // Barcode, QR Code, Serial Number or Batch Number
  codeType: 'Batch' | 'Serial' | 'WorkOrder' | 'MaterialLot';
  eventType:
    | 'RAW_MATERIAL_ISSUED'
    | 'OPERATION_STARTED'
    | 'OPERATION_COMPLETED'
    | 'FIRST_OFF_PASSED'
    | 'QUALITY_INSPECTION'
    | 'QUALITY_HOLD'
    | 'HOLD_RELEASED'
    | 'MAINTENANCE_LOGGED'
    | 'PACKAGED'
    | 'DISPATCHED';
  workOrderId?: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  machineId?: mongoose.Types.ObjectId;
  operatorId?: mongoose.Types.ObjectId;
  operatorName?: string;
  details: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
}

const TraceabilityEventSchema = new Schema<ITraceabilityEvent>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    trackingCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    codeType: {
      type: String,
      enum: ['Batch', 'Serial', 'WorkOrder', 'MaterialLot'],
      required: true,
      index: true
    },
    eventType: { type: String, required: true, index: true },
    workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder', index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', index: true },
    machineId: { type: Schema.Types.ObjectId, ref: 'Machine' },
    operatorId: { type: Schema.Types.ObjectId, ref: 'User' },
    operatorName: { type: String },
    details: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

export const TraceabilityEvent = mongoose.model<ITraceabilityEvent>('TraceabilityEvent', TraceabilityEventSchema);
