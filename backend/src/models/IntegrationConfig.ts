import mongoose, { Schema, Document } from 'mongoose';

export interface IIntegrationConfig extends Document {
  plantId: mongoose.Types.ObjectId;
  name: string;
  type: 'OPC_UA' | 'MQTT' | 'WEBHOOK' | 'ERP_ADAPTER';
  endpointUrl: string;
  authHeader?: string;
  webhookSecret?: string;
  isSimulated: boolean; // Clearly labels simulated factory data
  active: boolean;
  lastPingAt?: Date;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastErrorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationConfigSchema = new Schema<IIntegrationConfig>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['OPC_UA', 'MQTT', 'WEBHOOK', 'ERP_ADAPTER'],
      required: true,
      index: true
    },
    endpointUrl: { type: String, required: true },
    authHeader: { type: String },
    webhookSecret: { type: String },
    isSimulated: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
    lastPingAt: { type: Date },
    status: {
      type: String,
      enum: ['CONNECTED', 'DISCONNECTED', 'ERROR'],
      default: 'DISCONNECTED',
      index: true
    },
    lastErrorMessage: { type: String }
  },
  { timestamps: true }
);

export const IntegrationConfig = mongoose.model<IIntegrationConfig>('IntegrationConfig', IntegrationConfigSchema);
