import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import {
  Organization,
  Site,
  Plant,
  Department,
  Workstation
} from '../models/PlantHierarchy';
import { ProductionLine } from '../models/ProductionLine';
import { Machine } from '../models/Machine';
import { Product } from '../models/Product';
import { Material } from '../models/Material';
import { BOM } from '../models/BOM';
import { Routing } from '../models/Routing';
import { Shift } from '../models/Shift';
import { WorkOrder } from '../models/WorkOrder';
import { QualityPlan } from '../models/QualityPlan';
import { KPISettings } from '../models/KPISettings';
import { UserRole, MachineState, WorkOrderStatus, InspectionType } from '../config/constants';

export const seedDatabase = async () => {
  console.log('[Seed] Starting database initialization...');

  // 1. Organization
  let org = await Organization.findOne({ code: 'RSR-TECH' });
  if (!org) {
    org = await Organization.create({
      code: 'RSR-TECH',
      name: 'RSR Technologies Pvt Ltd',
      taxId: '29ABCDE1234F1Z5',
      headquarters: 'Bengaluru, Karnataka, India',
      active: true
    });
    console.log('[Seed] Created Organization: RSR Technologies');
  }

  // 2. Site
  let site = await Site.findOne({ code: 'BLR-COMPLEX' });
  if (!site) {
    site = await Site.create({
      organizationId: org._id,
      code: 'BLR-COMPLEX',
      name: 'Bengaluru Manufacturing Complex',
      address: 'Plot 42-45, Phase II Industrial Corridor',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560105',
      active: true
    });
    console.log('[Seed] Created Site: Bengaluru Manufacturing Complex');
  }

  // 3. Plants: Jigani Plant 1 & Bommasandra Plant 2
  let jiganiPlant = await Plant.findOne({ code: 'JGN-PLANT1' });
  if (!jiganiPlant) {
    jiganiPlant = await Plant.create({
      siteId: site._id,
      code: 'JGN-PLANT1',
      name: 'Jigani Precision Engineering Plant 1',
      location: 'Jigani Industrial Area, Bengaluru',
      timezone: 'Asia/Kolkata',
      managerName: 'Anil (Lead Dev / Plant Incharge)',
      contactEmail: 'anil@rsrtechnologies.in',
      active: true
    });
    console.log('[Seed] Created Plant: Jigani Plant 1');
  }

  let bommasandraPlant = await Plant.findOne({ code: 'BMS-PLANT2' });
  if (!bommasandraPlant) {
    bommasandraPlant = await Plant.create({
      siteId: site._id,
      code: 'BMS-PLANT2',
      name: 'Bommasandra Polymer & Packaging Plant 2',
      location: 'Bommasandra Industrial Area, Bengaluru',
      timezone: 'Asia/Kolkata',
      managerName: 'Production Operations Lead',
      contactEmail: 'ops.bms@rsrtechnologies.in',
      active: true
    });
    console.log('[Seed] Created Plant: Bommasandra Plant 2');
  }

  // 4. Default KPI Settings for Jigani Plant
  await KPISettings.findOneAndUpdate(
    { plantId: jiganiPlant._id },
    {
      plantId: jiganiPlant._id,
      formulaVersion: '1.0',
      excludePlannedBreaks: true,
      excludePlannedMaintenanceFromUnplannedDowntime: true,
      availabilityTargetPercent: 90,
      performanceTargetPercent: 95,
      qualityTargetPercent: 99,
      oeeTargetPercent: 85,
      minDataThresholdMinutes: 15
    },
    { upsert: true }
  );

  // 5. Departments
  const machiningDept = await Department.findOneAndUpdate(
    { plantId: jiganiPlant._id, code: 'MACHINING' },
    { plantId: jiganiPlant._id, code: 'MACHINING', name: 'Precision CNC Machining', active: true },
    { upsert: true, new: true }
  );

  const assemblyDept = await Department.findOneAndUpdate(
    { plantId: jiganiPlant._id, code: 'ASSEMBLY' },
    { plantId: jiganiPlant._id, code: 'ASSEMBLY', name: 'Automotive Sub-Assembly', active: true },
    { upsert: true, new: true }
  );

  // 6. Production Lines
  const line1 = await ProductionLine.findOneAndUpdate(
    { plantId: jiganiPlant._id, code: 'LINE-CNC-01' },
    {
      plantId: jiganiPlant._id,
      departmentId: machiningDept._id,
      code: 'LINE-CNC-01',
      name: 'CNC Machining Line 1 (Automotive)',
      status: 'Active',
      targetPerHour: 120,
      capacityPerShift: 900,
      active: true
    },
    { upsert: true, new: true }
  );

  const line2 = await ProductionLine.findOneAndUpdate(
    { plantId: jiganiPlant._id, code: 'LINE-ASSY-02' },
    {
      plantId: jiganiPlant._id,
      departmentId: assemblyDept._id,
      code: 'LINE-ASSY-02',
      name: 'Brake Caliper Assembly Line 2',
      status: 'Active',
      targetPerHour: 80,
      capacityPerShift: 600,
      active: true
    },
    { upsert: true, new: true }
  );

  // 7. Machines
  const machine1 = await Machine.findOneAndUpdate(
    { code: 'MCH-CNC-5AX-01' },
    {
      plantId: jiganiPlant._id,
      productionLineId: line1._id,
      code: 'MCH-CNC-5AX-01',
      name: '5-Axis Precision Machining Center #1',
      type: 'CNC Milling',
      manufacturer: 'Haas Automation',
      serialNumber: 'HAAS-VF4-2024-8891',
      capacityUnitsPerHour: 60,
      idealCycleTimeSeconds: 60,
      state: MachineState.IDLE,
      connectivityType: 'Simulated',
      operatingHoursTotal: 1420,
      active: true
    },
    { upsert: true, new: true }
  );

  const machine2 = await Machine.findOneAndUpdate(
    { code: 'MCH-CNC-LATHE-02' },
    {
      plantId: jiganiPlant._id,
      productionLineId: line1._id,
      code: 'MCH-CNC-LATHE-02',
      name: 'Twin-Spindle CNC Lathe #2',
      type: 'CNC Turning',
      manufacturer: 'Mazak',
      serialNumber: 'MZK-QTX-2023-4102',
      capacityUnitsPerHour: 90,
      idealCycleTimeSeconds: 40,
      state: MachineState.RUNNING,
      connectivityType: 'Simulated',
      operatingHoursTotal: 2150,
      active: true
    },
    { upsert: true, new: true }
  );

  const machine3 = await Machine.findOneAndUpdate(
    { code: 'MCH-ASSY-ROBOT-01' },
    {
      plantId: jiganiPlant._id,
      productionLineId: line2._id,
      code: 'MCH-ASSY-ROBOT-01',
      name: 'Automated Caliper Assembly Rig #1',
      type: 'Assembly Cell',
      manufacturer: 'ABB Robotics',
      serialNumber: 'ABB-IRB-2025-9011',
      capacityUnitsPerHour: 80,
      idealCycleTimeSeconds: 45,
      state: MachineState.IDLE,
      connectivityType: 'Simulated',
      operatingHoursTotal: 980,
      active: true
    },
    { upsert: true, new: true }
  );

  // 8. Shifts
  const shiftA = await Shift.findOneAndUpdate(
    { plantId: jiganiPlant._id, code: 'SHIFT_A' },
    {
      plantId: jiganiPlant._id,
      code: 'SHIFT_A',
      name: 'Morning Shift (A)',
      startTime: '06:00',
      endTime: '14:00',
      durationMinutes: 480,
      plannedBreakMinutes: 45,
      crossMidnight: false,
      breaks: [
        { name: 'Morning Tea', startTime: '09:00', durationMinutes: 15 },
        { name: 'Lunch Break', startTime: '11:30', durationMinutes: 30 }
      ],
      active: true
    },
    { upsert: true, new: true }
  );

  const shiftB = await Shift.findOneAndUpdate(
    { plantId: jiganiPlant._id, code: 'SHIFT_B' },
    {
      plantId: jiganiPlant._id,
      code: 'SHIFT_B',
      name: 'Afternoon Shift (B)',
      startTime: '14:00',
      endTime: '22:00',
      durationMinutes: 480,
      plannedBreakMinutes: 45,
      crossMidnight: false,
      breaks: [
        { name: 'Evening Tea', startTime: '17:00', durationMinutes: 15 },
        { name: 'Dinner Break', startTime: '19:30', durationMinutes: 30 }
      ],
      active: true
    },
    { upsert: true, new: true }
  );

  // 9. Raw Materials
  const rawAluminium = await Material.findOneAndUpdate(
    { plantId: jiganiPlant._id, code: 'RM-AL-6061' },
    {
      plantId: jiganiPlant._id,
      code: 'RM-AL-6061',
      name: 'Aerospace Grade Aluminium 6061 Billet',
      category: 'Raw Material',
      uom: 'KG',
      currentStock: 4500,
      safetyStock: 800,
      reorderLevel: 1500,
      unitCost: 280,
      locationBin: 'BIN-RM-A1',
      active: true
    },
    { upsert: true, new: true }
  );

  const sealKit = await Material.findOneAndUpdate(
    { plantId: jiganiPlant._id, code: 'COMP-SEAL-EPDM' },
    {
      plantId: jiganiPlant._id,
      code: 'COMP-SEAL-EPDM',
      name: 'High-Temperature EPDM Seal Kit',
      category: 'Component',
      uom: 'SET',
      currentStock: 1200,
      safetyStock: 300,
      reorderLevel: 600,
      unitCost: 145,
      locationBin: 'BIN-COMP-C4',
      active: true
    },
    { upsert: true, new: true }
  );

  // 10. Products
  const product1 = await Product.findOneAndUpdate(
    { plantId: jiganiPlant._id, code: 'PRD-CALIPER-X1' },
    {
      plantId: jiganiPlant._id,
      code: 'PRD-CALIPER-X1',
      name: 'High-Performance 4-Piston Brake Caliper',
      category: 'Automotive Sub-Assembly',
      uom: 'PCS',
      standardCycleTimeSeconds: 45,
      standardCost: 1850,
      barcode: '890400010019',
      active: true
    },
    { upsert: true, new: true }
  );

  // 11. Bill of Materials (BOM)
  await BOM.findOneAndUpdate(
    { plantId: jiganiPlant._id, productId: product1._id, version: '1.0' },
    {
      plantId: jiganiPlant._id,
      productId: product1._id,
      version: '1.0',
      active: true,
      items: [
        { materialId: rawAluminium._id, quantity: 2.4, uom: 'KG', scrapPercentage: 4, remarks: 'Machined body' },
        { materialId: sealKit._id, quantity: 1, uom: 'SET', scrapPercentage: 1, remarks: 'Hydraulic seals' }
      ]
    },
    { upsert: true }
  );

  // 12. Routing
  await Routing.findOneAndUpdate(
    { plantId: jiganiPlant._id, productId: product1._id, code: 'RTG-CALIPER-01' },
    {
      plantId: jiganiPlant._id,
      productId: product1._id,
      code: 'RTG-CALIPER-01',
      name: 'Standard Caliper Machining & Assembly Route',
      version: '1.0',
      active: true,
      operations: [
        { sequence: 10, name: 'CNC Rough Machining', cycleTimeSeconds: 40, setupTimeMinutes: 20, requiresQualityInspection: false },
        { sequence: 20, name: 'Precision Boring & Finishing', cycleTimeSeconds: 35, setupTimeMinutes: 15, requiresQualityInspection: true },
        { sequence: 30, name: 'Hydraulic Piston Assembly', cycleTimeSeconds: 45, setupTimeMinutes: 10, requiresQualityInspection: false },
        { sequence: 40, name: 'Pressure Testing & Final Inspection', cycleTimeSeconds: 30, setupTimeMinutes: 5, requiresQualityInspection: true }
      ]
    },
    { upsert: true }
  );

  // 13. Quality Plan
  await QualityPlan.findOneAndUpdate(
    { plantId: jiganiPlant._id, productId: product1._id, inspectionType: InspectionType.FIRST_OFF },
    {
      plantId: jiganiPlant._id,
      code: 'QP-CALIPER-FO',
      name: 'First-Off Inspection Protocol - Brake Caliper',
      productId: product1._id,
      inspectionType: InspectionType.FIRST_OFF,
      parameters: [
        { name: 'Bore Diameter (mm)', type: 'Numeric', nominalValue: 40.00, minTolerance: 39.98, maxTolerance: 40.02, sampleSize: 3, isMandatory: true },
        { name: 'Surface Roughness (Ra um)', type: 'Numeric', nominalValue: 0.8, minTolerance: 0.0, maxTolerance: 1.2, sampleSize: 3, isMandatory: true },
        { name: 'Burr and Chamfer Check', type: 'PassFail', sampleSize: 3, isMandatory: true }
      ],
      active: true
    },
    { upsert: true }
  );

  // 14. Seed Users for All 8 Approved Roles
  const passwordHash = await bcrypt.hash('RSRAdmin@2026!', 10);

  const roleUsers = [
    { email: 'admin@rsrtechnologies.in', name: 'System Administrator', role: UserRole.SYSTEM_ADMIN, permissions: ['*'] },
    { email: 'plant.manager@rsrtechnologies.in', name: 'Anil (Plant Manager)', role: UserRole.PLANT_MANAGER },
    { email: 'prod.manager@rsrtechnologies.in', name: 'Production Lead Raman', role: UserRole.PRODUCTION_MANAGER },
    { email: 'supervisor@rsrtechnologies.in', name: 'Shift Supervisor Karthik', role: UserRole.SHIFT_SUPERVISOR },
    { email: 'operator@rsrtechnologies.in', name: 'Operator Manjunath', role: UserRole.MACHINE_OPERATOR },
    { email: 'quality@rsrtechnologies.in', name: 'Quality Manager Sneha', role: UserRole.QUALITY_MANAGER },
    { email: 'maintenance@rsrtechnologies.in', name: 'Maintenance Engineer Suresh', role: UserRole.MAINTENANCE_ENGINEER },
    { email: 'warehouse@rsrtechnologies.in', name: 'Warehouse Incharge Venkatesh', role: UserRole.WAREHOUSE_MANAGER }
  ];

  for (const u of roleUsers) {
    await User.findOneAndUpdate(
      { email: u.email },
      {
        email: u.email,
        passwordHash,
        name: u.name,
        role: u.role,
        plantId: jiganiPlant._id,
        permissions: u.permissions || [],
        active: true
      },
      { upsert: true }
    );
  }
  console.log('[Seed] Configured enterprise role users with verified credentials.');

  // 15. Seed an Initial Released Work Order for immediate shop-floor testing
  const supervisor = await User.findOne({ role: UserRole.SHIFT_SUPERVISOR });
  const operator = await User.findOne({ role: UserRole.MACHINE_OPERATOR });

  await WorkOrder.findOneAndUpdate(
    { orderNumber: 'WO-2026-0001' },
    {
      orderNumber: 'WO-2026-0001',
      plantId: jiganiPlant._id,
      productId: product1._id,
      productionLineId: line1._id,
      shiftId: shiftA._id,
      supervisorId: supervisor?._id,
      assignedOperatorId: operator?._id,
      plannedQuantity: 500,
      completedQuantity: 120,
      rejectedQuantity: 4,
      priority: 'High',
      status: WorkOrderStatus.RELEASED,
      startDatePlanned: new Date(),
      dueDate: new Date(Date.now() + 48 * 3600000),
      batchNumber: 'BATCH-2026-4401',
      instructions: 'Ensure cooling fluid flow rate is maintained above 15 L/min during CNC boring operation.'
    },
    { upsert: true }
  );

  console.log('[Seed] Database initialization complete.');
};

if (require.main === module) {
  connectDB()
    .then(seedDatabase)
    .then(() => disconnectDB())
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}
