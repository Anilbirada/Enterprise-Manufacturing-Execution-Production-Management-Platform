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

export enum DowntimeCategory {
  MECHANICAL_FAILURE = 'Mechanical Failure',
  ELECTRICAL_FAILURE = 'Electrical Failure',
  MATERIAL_SHORTAGE = 'Material Shortage',
  OPERATOR_UNAVAILABLE = 'Operator Unavailable',
  CHANGEOVER = 'Changeover',
  QUALITY_ISSUE = 'Quality Issue',
  PLAN_MAINTENANCE = 'Planned Maintenance',
  OTHER = 'Other'
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

export enum InspectionType {
  INCOMING = 'Incoming',
  FIRST_OFF = 'First-Off',
  IN_PROCESS = 'In-Process',
  FINAL = 'Final'
}

export enum QualityDisposition {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  REWORK = 'Rework',
  CONCESSION = 'Concession'
}

export enum MaintenanceType {
  PREVENTIVE = 'Preventive',
  BREAKDOWN = 'Breakdown',
  CALIBRATION = 'Calibration'
}

export enum MaintenanceStatus {
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled'
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SYSTEM_ADMIN]: ['*'], // Full access
  [UserRole.PLANT_MANAGER]: [
    'dashboard:view', 'reports:view', 'reports:export', 'oee:view', 'oee:configure',
    'production:view', 'machines:view', 'quality:view', 'maintenance:view',
    'andon:view', 'andon:escalate', 'inventory:view', 'traceability:view', 'audit:view'
  ],
  [UserRole.PRODUCTION_MANAGER]: [
    'dashboard:view', 'planning:create', 'planning:edit', 'planning:view',
    'workorders:create', 'workorders:edit', 'workorders:release', 'workorders:view',
    'production:view', 'lines:view', 'shifts:view', 'shifts:edit',
    'reports:view', 'reports:export', 'oee:view', 'andon:view'
  ],
  [UserRole.SHIFT_SUPERVISOR]: [
    'dashboard:view', 'workorders:view', 'workorders:edit',
    'production:view', 'production:assign', 'production:approve',
    'andon:view', 'andon:acknowledge', 'andon:resolve', 'andon:escalate',
    'machines:view', 'machines:update_status', 'shifts:view',
    'quality:view', 'reports:view'
  ],
  [UserRole.MACHINE_OPERATOR]: [
    'execution:view', 'execution:start', 'execution:pause', 'execution:resume', 'execution:complete',
    'execution:record_qty', 'execution:record_rejection', 'execution:report_downtime',
    'andon:create', 'workinstructions:view'
  ],
  [UserRole.QUALITY_MANAGER]: [
    'dashboard:view', 'quality:view', 'quality:create_plan', 'quality:inspect',
    'quality:hold', 'quality:release_hold', 'quality:ncr', 'quality:capa',
    'reports:view', 'reports:export', 'traceability:view'
  ],
  [UserRole.MAINTENANCE_ENGINEER]: [
    'dashboard:view', 'maintenance:view', 'maintenance:create', 'maintenance:update',
    'maintenance:close', 'machines:view', 'machines:update_status', 'downtime:view',
    'andon:view', 'andon:acknowledge', 'andon:resolve'
  ],
  [UserRole.WAREHOUSE_MANAGER]: [
    'dashboard:view', 'inventory:view', 'inventory:receive', 'inventory:issue',
    'inventory:adjust', 'traceability:view', 'barcode:generate', 'barcode:scan'
  ]
};
