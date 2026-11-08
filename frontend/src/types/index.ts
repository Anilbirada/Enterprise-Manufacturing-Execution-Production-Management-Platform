export enum UserRole {
  SYSTEM_ADMIN = 'System Administrator',
  PLANT_MANAGER = 'Plant Manager',
  PRODUCTION_MANAGER = 'Production Manager',
  SHIFT_SUPERVISOR = 'Shift Supervisor',
  MACHINE_OPERATOR = 'Machine Operator',
  QUALITY_MANAGER = 'Quality Manager',
  MAINTENANCE_ENGINEER = 'Maintenance Engineer',
  WAREHOUSE_MANAGER = 'Warehouse Manager'
}

export enum WorkOrderStatus {
  DRAFT = 'Draft',
  PLANNED = 'Planned',
  RELEASED = 'Released',
  IN_PROGRESS = 'In Progress',
  PAUSED = 'Paused',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export enum MachineState {
  RUNNING = 'Running',
  IDLE = 'Idle',
  STOPPED = 'Stopped',
  MAINTENANCE = 'Maintenance',
  FAULT = 'Fault',
  OFFLINE = 'Offline'
}

export enum AndonSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum AndonStatus {
  OPEN = 'Open',
  ACKNOWLEDGED = 'Acknowledged',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed'
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plantId?: string;
  plantName?: string;
  permissions: string[];
}

export interface Plant {
  _id: string;
  code: string;
  name: string;
  location: string;
  timezone: string;
  managerName?: string;
  active: boolean;
}

export interface ProductionLine {
  _id: string;
  plantId: any;
  code: string;
  name: string;
  description?: string;
  status: 'Active' | 'Maintenance' | 'Down' | 'Idle';
  targetPerHour: number;
  capacityPerShift: number;
  currentWorkOrderId?: any;
  active: boolean;
}

export interface Machine {
  _id: string;
  code: string;
  name: string;
  type: string;
  manufacturer?: string;
  serialNumber?: string;
  capacityUnitsPerHour: number;
  idealCycleTimeSeconds: number;
  state: MachineState;
  connectivityType: 'Manual' | 'Simulated' | 'OPC_UA' | 'MQTT';
  lastStateChange: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  operatingHoursTotal: number;
  productionLineId?: any;
  currentWorkOrderId?: any;
  currentOperatorId?: any;
  active: boolean;
}

export interface Product {
  _id: string;
  code: string;
  name: string;
  category: string;
  uom: string;
  standardCycleTimeSeconds: number;
  standardCost?: number;
  barcode?: string;
  active: boolean;
}

export interface Material {
  _id: string;
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
}

export interface BOMItem {
  materialId: any;
  quantity: number;
  uom: string;
  scrapPercentage: number;
  remarks?: string;
}

export interface BOM {
  _id: string;
  productId: any;
  version: string;
  active: boolean;
  notes?: string;
  items: BOMItem[];
}

export interface WorkOrder {
  _id: string;
  orderNumber: string;
  plantId: any;
  productId: any;
  routingId?: any;
  productionLineId?: any;
  shiftId?: any;
  supervisorId?: any;
  assignedOperatorId?: any;
  plannedQuantity: number;
  completedQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: WorkOrderStatus;
  currentOperationSequence: number;
  startDatePlanned: string;
  dueDate: string;
  actualStartTime?: string;
  actualEndTime?: string;
  batchNumber?: string;
  isQualityHold: boolean;
  qualityHoldReason?: string;
  instructions?: string;
  history?: any[];
  createdAt: string;
}

export interface Shift {
  _id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  plannedBreakMinutes: number;
  breaks?: { name: string; startTime: string; durationMinutes: number }[];
  active: boolean;
}

export interface DowntimeEvent {
  _id: string;
  machineId: any;
  productionLineId?: any;
  category: string;
  isPlanned: boolean;
  reasonDescription: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  reportedBy: any;
  resolvedBy?: any;
  resolutionRemarks?: string;
  active: boolean;
}

export interface AndonIssue {
  _id: string;
  issueNumber: string;
  productionLineId: any;
  machineId?: any;
  workOrderId?: any;
  title: string;
  description: string;
  category: string;
  severity: AndonSeverity;
  status: AndonStatus;
  reportedBy: any;
  acknowledgedBy?: any;
  resolvedBy?: any;
  reportedAt: string;
  isEscalated: boolean;
  escalationLevel: number;
}

export enum InspectionType {
  INCOMING = 'Incoming',
  FIRST_OFF = 'First-Off',
  IN_PROCESS = 'In-Process',
  FINAL = 'Final',
  PDI = 'PDI'
}

export enum QualityDisposition {
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  REWORK = 'Rework',
  CONCESSION = 'Concession'
}

export interface Inspection {
  _id: string;
  inspectionNumber: string;
  productId: any;
  workOrderId?: any;
  machineId?: any;
  inspectionType: InspectionType | string;
  sampleSize: number;
  inspectedQuantity: number;
  passedQuantity: number;
  rejectedQuantity: number;
  disposition: QualityDisposition | string;
  defectReason?: string;
  inspectorId: any;
  inspectedAt: string;
  parameterResults?: any[];
}

export interface QualityHold {
  _id: string;
  holdNumber: string;
  entityType: string;
  entityId: string;
  entityIdentifier: string;
  reason: string;
  placedBy: any;
  placedByName: string;
  placedAt: string;
  status: 'Active' | 'Released';
  releasedBy?: any;
  releasedByName?: string;
  releasedAt?: string;
  releaseJustification?: string;
}

export interface MaintenanceOrder {
  _id: string;
  orderNumber: string;
  machineId: any;
  type: string;
  status: string;
  priority: string;
  title: string;
  description: string;
  scheduledDate: string;
  startDate?: string;
  completionDate?: string;
  assignedTechnicianId?: any;
  actionsTaken?: string;
  downtimeDurationMinutes: number;
  spareParts?: any[];
}

export interface WorkInstruction {
  _id: string;
  code: string;
  title: string;
  productId?: any;
  operationName?: string;
  version: string;
  steps: {
    stepNumber: number;
    title: string;
    instructionText: string;
    safetyCaution?: string;
    criticalCheckPoint?: string;
  }[];
  signOffs?: any[];
}

export interface OEEMetrics {
  scope: string;
  name?: string;
  plannedProductionMinutes: number;
  operatingMinutes: number;
  unplannedDowntimeMinutes: number;
  totalProductionCount: number;
  goodQuantity: number;
  rejectedQuantity: number;
  availabilityPercent: number | null;
  performancePercent: number | null;
  qualityPercent: number | null;
  oeePercent: number | null;
  status: string;
  hasSufficientData: boolean;
  formulaVersion: string;
}
