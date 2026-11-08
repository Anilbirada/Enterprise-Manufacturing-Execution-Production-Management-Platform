import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  plantId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  userName?: string;
  action: string; // e.g. "CREATE_WORK_ORDER", "STATUS_CHANGE", "PRODUCTION_BOOKING", "QUALITY_HOLD"
  entity: string; // e.g. "WorkOrder", "ProductionEntry", "Machine", "User"
  entityId?: string;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILURE' | 'ACCESS_DENIED';
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userEmail: { type: String },
    userName: { type: String },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    entityId: { type: String, index: true },
    previousValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'ACCESS_DENIED'],
      default: 'SUCCESS',
      index: true
    },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
