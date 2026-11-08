import mongoose, { Schema, Document } from 'mongoose';

export interface IInstructionStep {
  stepNumber: number;
  title: string;
  instructionText: string;
  safetyCaution?: string;
  imageUrl?: string;
  criticalCheckPoint?: string;
}

export interface IOperatorSignOff {
  operatorId: mongoose.Types.ObjectId;
  operatorName: string;
  workOrderId?: mongoose.Types.ObjectId;
  signedAt: Date;
}

export interface IWorkInstruction extends Document {
  plantId: mongoose.Types.ObjectId;
  code: string;
  title: string;
  productId?: mongoose.Types.ObjectId;
  operationName?: string;
  version: string;
  status: 'Draft' | 'Published' | 'Archived';
  steps: IInstructionStep[];
  signOffs: IOperatorSignOff[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InstructionStepSchema = new Schema<IInstructionStep>({
  stepNumber: { type: Number, required: true },
  title: { type: String, required: true },
  instructionText: { type: String, required: true },
  safetyCaution: { type: String },
  imageUrl: { type: String },
  criticalCheckPoint: { type: String }
});

const OperatorSignOffSchema = new Schema<IOperatorSignOff>({
  operatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  operatorName: { type: String, required: true },
  workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
  signedAt: { type: Date, default: Date.now }
});

const WorkInstructionSchema = new Schema<IWorkInstruction>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    title: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', index: true },
    operationName: { type: String },
    version: { type: String, default: '1.0' },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Published',
      index: true
    },
    steps: [InstructionStepSchema],
    signOffs: [OperatorSignOffSchema],
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

WorkInstructionSchema.index({ plantId: 1, code: 1, version: 1 }, { unique: true });

export const WorkInstruction = mongoose.model<IWorkInstruction>('WorkInstruction', WorkInstructionSchema);
