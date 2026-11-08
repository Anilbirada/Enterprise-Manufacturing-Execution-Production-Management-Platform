import mongoose, { Schema, Document } from 'mongoose';

export interface IBOMItem {
  materialId: mongoose.Types.ObjectId;
  quantity: number;
  uom: string;
  scrapPercentage: number;
  remarks?: string;
}

export interface IBOM extends Document {
  plantId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  version: string;
  active: boolean;
  notes?: string;
  items: IBOMItem[];
  createdAt: Date;
  updatedAt: Date;
}

const BOMItemSchema = new Schema<IBOMItem>({
  materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
  quantity: { type: Number, required: true, min: 0.0001 },
  uom: { type: String, required: true },
  scrapPercentage: { type: Number, default: 0, min: 0, max: 100 },
  remarks: { type: String }
});

const BOMSchema = new Schema<IBOM>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    version: { type: String, default: '1.0', required: true },
    active: { type: Boolean, default: true, index: true },
    notes: { type: String },
    items: [BOMItemSchema]
  },
  { timestamps: true }
);

BOMSchema.index({ plantId: 1, productId: 1, version: 1 }, { unique: true });

export const BOM = mongoose.model<IBOM>('BOM', BOMSchema);
