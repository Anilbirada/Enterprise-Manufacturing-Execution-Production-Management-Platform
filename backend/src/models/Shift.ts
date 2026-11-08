import mongoose, { Schema, Document } from 'mongoose';

export interface IShiftBreak {
  name: string;
  startTime: string; // e.g. "09:30"
  durationMinutes: number; // e.g. 15
}

export interface IShift extends Document {
  plantId: mongoose.Types.ObjectId;
  code: string;
  name: string;
  startTime: string; // "HH:mm" e.g. "06:00"
  endTime: string; // "HH:mm" e.g. "14:00"
  durationMinutes: number; // e.g. 480
  plannedBreakMinutes: number; // e.g. 45
  crossMidnight: boolean;
  breaks: IShiftBreak[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftBreakSchema = new Schema<IShiftBreak>({
  name: { type: String, required: true },
  startTime: { type: String, required: true },
  durationMinutes: { type: Number, required: true }
});

const ShiftSchema = new Schema<IShift>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    durationMinutes: { type: Number, default: 480 },
    plannedBreakMinutes: { type: Number, default: 45 },
    crossMidnight: { type: Boolean, default: false },
    breaks: [ShiftBreakSchema],
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

ShiftSchema.index({ plantId: 1, code: 1 }, { unique: true });

export const Shift = mongoose.model<IShift>('Shift', ShiftSchema);
