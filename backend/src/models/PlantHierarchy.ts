import mongoose, { Schema, Document } from 'mongoose';

// Organization (e.g. RSR Technologies)
export interface IOrganization extends Document {
  code: string;
  name: string;
  taxId?: string;
  headquarters?: string;
  active: boolean;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    taxId: { type: String },
    headquarters: { type: String },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Site (e.g. Bengaluru Manufacturing Complex)
export interface ISite extends Document {
  organizationId: mongoose.Types.ObjectId;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  active: boolean;
}

const SiteSchema = new Schema<ISite>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, default: 'Bengaluru' },
    state: { type: String, default: 'Karnataka' },
    postalCode: { type: String },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Plant (e.g. Jigani Plant 1, Bommasandra Plant 2)
export interface IPlant extends Document {
  siteId: mongoose.Types.ObjectId;
  code: string;
  name: string;
  location: string;
  timezone: string;
  managerName?: string;
  contactEmail?: string;
  active: boolean;
}

const PlantSchema = new Schema<IPlant>(
  {
    siteId: { type: Schema.Types.ObjectId, ref: 'Site', required: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    managerName: { type: String },
    contactEmail: { type: String },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Department (e.g. Pressing, Machining, Assembly, Packaging, Quality)
export interface IDepartment extends Document {
  plantId: mongoose.Types.ObjectId;
  code: string;
  name: string;
  active: boolean;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);
DepartmentSchema.index({ plantId: 1, code: 1 }, { unique: true });

// Workstation
export interface IWorkstation extends Document {
  plantId: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  code: string;
  name: string;
  active: boolean;
}

const WorkstationSchema = new Schema<IWorkstation>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
export const Site = mongoose.model<ISite>('Site', SiteSchema);
export const Plant = mongoose.model<IPlant>('Plant', PlantSchema);
export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);
export const Workstation = mongoose.model<IWorkstation>('Workstation', WorkstationSchema);
