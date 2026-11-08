import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../config/constants';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  plantId?: mongoose.Types.ObjectId;
  active: boolean;
  permissions: string[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.MACHINE_OPERATOR,
      required: true,
      index: true
    },
    plantId: {
      type: Schema.Types.ObjectId,
      ref: 'Plant',
      index: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    permissions: {
      type: [String],
      default: []
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
