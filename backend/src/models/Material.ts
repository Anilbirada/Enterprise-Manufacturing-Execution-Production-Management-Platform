import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterial extends Document {
  plantId: mongoose.Types.ObjectId;
  code: string;
  name: string;
  category: 'Raw Material' | 'Component' | 'Packaging' | 'Consumable';
  uom: string;
  currentStock: number;
  safetyStock: number;
  reorderLevel: number;
  unitCost: number;
  locationBin?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterial>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Raw Material', 'Component', 'Packaging', 'Consumable'],
      default: 'Raw Material',
      index: true
    },
    uom: { type: String, default: 'KG' },
    currentStock: { type: Number, default: 0, min: 0 },
    safetyStock: { type: Number, default: 100, min: 0 },
    reorderLevel: { type: Number, default: 200, min: 0 },
    unitCost: { type: Number, default: 0 },
    locationBin: { type: String },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

MaterialSchema.index({ plantId: 1, code: 1 }, { unique: true });

export const Material = mongoose.model<IMaterial>('Material', MaterialSchema);
