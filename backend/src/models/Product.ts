import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  plantId: mongoose.Types.ObjectId;
  code: string; // SKU or Part number
  name: string;
  category: string;
  uom: string; // Unit of measurement: PCS, KG, METER, BOX, SET
  description?: string;
  standardCycleTimeSeconds: number;
  standardCost?: number;
  barcode?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    uom: { type: String, default: 'PCS' },
    description: { type: String },
    standardCycleTimeSeconds: { type: Number, default: 30, min: 0.1 },
    standardCost: { type: Number, default: 0 },
    barcode: { type: String, trim: true },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

ProductSchema.index({ plantId: 1, code: 1 }, { unique: true });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
