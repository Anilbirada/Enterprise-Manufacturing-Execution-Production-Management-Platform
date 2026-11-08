import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/server';
import { OEEService } from '../src/services/oeeService';
import { WorkOrderService } from '../src/services/workOrderService';
import { WorkOrderStatus, MachineState, UserRole, InspectionType, QualityDisposition } from '../src/config/constants';
import { User } from '../src/models/User';
import { Product } from '../src/models/Product';
import { Machine } from '../src/models/Machine';
import { ProductionLine } from '../src/models/ProductionLine';
import { Shift } from '../src/models/Shift';
import { WorkOrder } from '../src/models/WorkOrder';
import { ProductionEntry } from '../src/models/ProductionEntry';
import { DowntimeEvent } from '../src/models/DowntimeEvent';
import { QualityHold } from '../src/models/QualityHold';
import { Plant, Site, Organization } from '../src/models/PlantHierarchy';

let mongoServer: MongoMemoryServer;
let adminToken: string;
let prodManagerToken: string;
let supervisorToken: string;
let operatorToken: string;
let qualityManagerToken: string;
let maintenanceToken: string;

let plantId: string;
let testProductId: string;
let testLineId: string;
let testMachineId: string;
let testShiftId: string;
let testWorkOrderId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Set up base org, site, plant
  const org = await Organization.create({ code: 'TEST-ORG', name: 'Test Org' });
  const site = await Site.create({ organizationId: org._id, code: 'TEST-SITE', name: 'Test Site', address: 'Jigani' });
  const plant = await Plant.create({ siteId: site._id, code: 'TEST-PLANT', name: 'Test Jigani Plant', location: 'Jigani' });
  plantId = plant._id.toString();

  // Create Users for Testing
  // 1. Admin
  await request(app)
    .post('/api/auth/setup-admin')
    .send({ email: 'admin@test.com', password: 'Password123!', name: 'Test Admin' });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'Password123!' });
  adminToken = adminLogin.body.token;

  // 2. Production Manager
  const pmRes = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: 'pm@test.com',
      password: 'Password123!',
      name: 'Test PM',
      role: UserRole.PRODUCTION_MANAGER,
      plantId
    });

  const pmLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'pm@test.com', password: 'Password123!' });
  prodManagerToken = pmLogin.body.token;

  // 3. Supervisor
  await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: 'sup@test.com',
      password: 'Password123!',
      name: 'Test Supervisor',
      role: UserRole.SHIFT_SUPERVISOR,
      plantId
    });
  const supLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'sup@test.com', password: 'Password123!' });
  supervisorToken = supLogin.body.token;

  // 4. Operator
  await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: 'op@test.com',
      password: 'Password123!',
      name: 'Test Operator',
      role: UserRole.MACHINE_OPERATOR,
      plantId
    });
  const opLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'op@test.com', password: 'Password123!' });
  operatorToken = opLogin.body.token;

  // 5. Quality Manager
  await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: 'qm@test.com',
      password: 'Password123!',
      name: 'Test Quality Manager',
      role: UserRole.QUALITY_MANAGER,
      plantId
    });
  const qmLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'qm@test.com', password: 'Password123!' });
  qualityManagerToken = qmLogin.body.token;

  // 6. Maintenance Engineer
  await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: 'maint@test.com',
      password: 'Password123!',
      name: 'Test Maintenance',
      role: UserRole.MAINTENANCE_ENGINEER,
      plantId
    });
  const maintLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'maint@test.com', password: 'Password123!' });
  maintenanceToken = maintLogin.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('UNIT TESTS: Core MES Algorithms & Logic', () => {
  test('OEE Formula unit test with verified manufacturing math', () => {
    // 480 minutes shift - 60 minutes planned breaks = 420 planned minutes
    // 60 minutes unplanned downtime -> 360 operating minutes
    // Availability = 360 / 420 = 85.71%
    // Produced: 340 good + 20 rejected = 360 total pieces
    // Ideal cycle time = 60s (1 min/piece)
    // Performance = (60s * 360 pieces) / (360 operating minutes * 60s) = 100%
    // Quality = 340 good / 360 total = 94.44%
    // OEE = 85.71% * 100% * 94.44% = 80.95%
    const res = OEEService.calculateOEEFromMetrics({
      plannedProductionMinutes: 420,
      unplannedDowntimeMinutes: 60,
      goodQuantity: 340,
      rejectedQuantity: 20,
      idealCycleTimeSeconds: 60
    });

    expect(res.operatingMinutes).toBe(360);
    expect(res.availability).toBeCloseTo(85.71, 1);
    expect(res.performance).toBeCloseTo(100.0, 1);
    expect(res.quality).toBeCloseTo(94.44, 1);
    expect(res.oee).toBeCloseTo(80.95, 1);
  });

  test('OEE returns null / insufficient data when planned time is 0', () => {
    const res = OEEService.calculateOEEFromMetrics({
      plannedProductionMinutes: 0,
      unplannedDowntimeMinutes: 0,
      goodQuantity: 0,
      rejectedQuantity: 0,
      idealCycleTimeSeconds: 60
    });

    expect(res.oee).toBeNull();
    expect(res.availability).toBeNull();
  });

  test('Work Order state machine transitions validation', () => {
    expect(WorkOrderService.isValidTransition(WorkOrderStatus.DRAFT, WorkOrderStatus.PLANNED)).toBe(true);
    expect(WorkOrderService.isValidTransition(WorkOrderStatus.PLANNED, WorkOrderStatus.RELEASED)).toBe(true);
    expect(WorkOrderService.isValidTransition(WorkOrderStatus.RELEASED, WorkOrderStatus.IN_PROGRESS)).toBe(true);
    expect(WorkOrderService.isValidTransition(WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.COMPLETED)).toBe(true);

    // Invalid transitions
    expect(WorkOrderService.isValidTransition(WorkOrderStatus.DRAFT, WorkOrderStatus.COMPLETED)).toBe(false);
    expect(WorkOrderService.isValidTransition(WorkOrderStatus.COMPLETED, WorkOrderStatus.IN_PROGRESS)).toBe(false);
  });
});

describe('15 MANDATORY END-TO-END MANUFACTURING WORKFLOW TESTS', () => {
  // TEST 1: Admin creates product, machine, production line and shift
  test('TEST 1: Admin creates product, machine, production line and shift', async () => {
    // 1. Create Product
    const prodRes = await request(app)
      .post('/api/master-data/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        plantId,
        code: 'TEST-PART-01',
        name: 'Precision Rotor Shaft',
        category: 'Automobile',
        uom: 'PCS',
        standardCycleTimeSeconds: 45
      });
    expect(prodRes.status).toBe(201);
    testProductId = prodRes.body.product._id;

    // 2. Create Production Line
    const lineRes = await request(app)
      .post('/api/master-data/lines')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        plantId,
        code: 'TEST-LINE-01',
        name: 'Rotor Assembly Line 1',
        targetPerHour: 100,
        capacityPerShift: 800
      });
    expect(lineRes.status).toBe(201);
    testLineId = lineRes.body.line._id;

    // 3. Create Machine
    const mchRes = await request(app)
      .post('/api/master-data/machines')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        plantId,
        productionLineId: testLineId,
        code: 'TEST-CNC-01',
        name: 'CNC Lathe Test #1',
        type: 'CNC Turning',
        capacityUnitsPerHour: 80,
        idealCycleTimeSeconds: 45,
        state: MachineState.IDLE
      });
    expect(mchRes.status).toBe(201);
    testMachineId = mchRes.body.machine._id;

    // 4. Create Shift
    const shiftRes = await request(app)
      .post('/api/master-data/shifts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        plantId,
        code: 'TEST-SHIFT-A',
        name: 'Test Morning Shift A',
        startTime: '06:00',
        endTime: '14:00',
        durationMinutes: 480,
        plannedBreakMinutes: 45
      });
    expect(shiftRes.status).toBe(201);
    testShiftId = shiftRes.body.shift._id;
  });

  // TEST 2: Production manager creates a work order
  test('TEST 2: Production manager creates a work order', async () => {
    const res = await request(app)
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${prodManagerToken}`)
      .send({
        plantId,
        orderNumber: 'WO-E2E-1001',
        productId: testProductId,
        plannedQuantity: 200,
        priority: 'High',
        startDatePlanned: new Date(),
        dueDate: new Date(Date.now() + 86400000),
        instructions: 'Test work order for E2E verification'
      });

    expect(res.status).toBe(201);
    expect(res.body.workOrder.orderNumber).toBe('WO-E2E-1001');
    expect(res.body.workOrder.status).toBe(WorkOrderStatus.DRAFT);
    expect(res.body.workOrder.batchNumber).toBeDefined();
    testWorkOrderId = res.body.workOrder._id;
  });

  // TEST 3: Supervisor assigns it to a production line and shift and releases it
  test('TEST 3: Supervisor assigns it to a production line and shift and releases it', async () => {
    // 1. Move to Planned with Line & Shift assignment
    const assignRes = await request(app)
      .put(`/api/work-orders/${testWorkOrderId}`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        productionLineId: testLineId,
        shiftId: testShiftId
      });
    expect(assignRes.status).toBe(200);

    const planRes = await request(app)
      .post(`/api/work-orders/${testWorkOrderId}/transition`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({ toStatus: WorkOrderStatus.PLANNED, reason: 'Assigned to line 1 and shift A' });
    expect(planRes.status).toBe(200);
    expect(planRes.body.workOrder.status).toBe(WorkOrderStatus.PLANNED);

    // 2. Release work order
    const releaseRes = await request(app)
      .post(`/api/work-orders/${testWorkOrderId}/transition`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({ toStatus: WorkOrderStatus.RELEASED, reason: 'Released for shop floor execution' });
    expect(releaseRes.status).toBe(200);
    expect(releaseRes.body.workOrder.status).toBe(WorkOrderStatus.RELEASED);
  });

  // TEST 4: Operator logs in and records production
  test('TEST 4: Operator logs in and records production', async () => {
    const res = await request(app)
      .post('/api/execution/record')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        plantId,
        workOrderId: testWorkOrderId,
        machineId: testMachineId,
        shiftId: testShiftId,
        operationSequence: 10,
        goodQuantity: 50,
        rejectedQuantity: 0,
        durationMinutes: 40,
        idempotencyKey: 'idemp-test-e2e-001'
      });

    expect(res.status).toBe(201);
    expect(res.body.entry.goodQuantity).toBe(50);

    // Verify Work Order was updated
    const wo = await WorkOrder.findById(testWorkOrderId);
    expect(wo?.completedQuantity).toBe(50);
    expect(wo?.status).toBe(WorkOrderStatus.IN_PROGRESS);
  });

  // TEST 5: Operator reports rejected products
  test('TEST 5: Operator reports rejected products', async () => {
    const res = await request(app)
      .post('/api/execution/record')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        plantId,
        workOrderId: testWorkOrderId,
        machineId: testMachineId,
        shiftId: testShiftId,
        operationSequence: 10,
        goodQuantity: 25,
        rejectedQuantity: 5,
        rejectionReason: 'Dimension out of tolerance',
        defectCategory: 'Machining Burr',
        durationMinutes: 25,
        idempotencyKey: 'idemp-test-e2e-002'
      });

    expect(res.status).toBe(201);
    const wo = await WorkOrder.findById(testWorkOrderId);
    expect(wo?.completedQuantity).toBe(75); // 50 + 25
    expect(wo?.rejectedQuantity).toBe(5);
  });

  // TEST 6: Operator reports machine downtime
  test('TEST 6: Operator reports machine downtime', async () => {
    const res = await request(app)
      .post('/api/downtime/report')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        machineId: testMachineId,
        category: 'Mechanical Failure',
        reasonDescription: 'Tooling wear on spindle 1',
        isPlanned: false,
        workOrderId: testWorkOrderId
      });

    expect(res.status).toBe(201);
    expect(res.body.event.active).toBe(true);
  });

  // TEST 7: System updates machine and line status
  test('TEST 7: System updates machine and line status', async () => {
    const mch = await Machine.findById(testMachineId);
    expect(mch?.state).toBe(MachineState.FAULT);
  });

  // TEST 8: System calculates OEE using approved formulas
  test('TEST 8: System calculates OEE using approved formulas', async () => {
    const res = await request(app)
      .get(`/api/oee/machine/${testMachineId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.result).toBeDefined();
    expect(res.body.result.totalProductionCount).toBe(80); // 75 good + 5 rejected
    expect(res.body.result.goodQuantity).toBe(75);
    expect(res.body.result.rejectedQuantity).toBe(5);
  });

  // TEST 9: Manager views updated production dashboard
  test('TEST 9: Manager views updated production dashboard', async () => {
    const res = await request(app)
      .get(`/api/dashboard/realtime?plantId=${plantId}`)
      .set('Authorization', `Bearer ${prodManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.summary.completedTotal).toBeGreaterThanOrEqual(75);
    expect(res.body.machineStatusCounts.fault).toBeGreaterThanOrEqual(1);
  });

  // TEST 10: Manager downloads a shift production report
  test('TEST 10: Manager downloads a shift production report', async () => {
    const res = await request(app)
      .get(`/api/reports/shift?format=csv&plantId=${plantId}`)
      .set('Authorization', `Bearer ${prodManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('WO-E2E-1001');
  });

  // TEST 11: Quality manager creates an inspection and records a rejection
  test('TEST 11: Quality manager creates an inspection and records a rejection', async () => {
    const res = await request(app)
      .post('/api/quality/inspections')
      .set('Authorization', `Bearer ${qualityManagerToken}`)
      .send({
        plantId,
        workOrderId: testWorkOrderId,
        productId: testProductId,
        inspectionType: InspectionType.IN_PROCESS,
        sampleSize: 10,
        inspectedQuantity: 10,
        passedQuantity: 8,
        rejectedQuantity: 2,
        disposition: QualityDisposition.REJECTED,
        defectReason: 'Surface porosity defect',
        parameterResults: [
          { parameterName: 'Bore Check', passed: false, remarks: '0.05mm oversize' }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.inspection.disposition).toBe(QualityDisposition.REJECTED);

    // Verify automated Non-Conformance (NCR) generation
    const ncrRes = await request(app)
      .get(`/api/quality/ncr?plantId=${plantId}`)
      .set('Authorization', `Bearer ${qualityManagerToken}`);

    expect(ncrRes.status).toBe(200);
    expect(ncrRes.body.count).toBeGreaterThanOrEqual(1);
  });

  // TEST 12: Unauthorized users attempt restricted operations and receive access-denied responses
  test('TEST 12: Unauthorized users attempt restricted operations and receive access-denied responses', async () => {
    // Machine Operator attempting to configure KPI settings (restricted to Admin/Quality Manager)
    const res = await request(app)
      .put('/api/oee/settings')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        plantId,
        availabilityTargetPercent: 99
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Access denied');
  });

  // TEST 13: Offline operator actions synchronize without duplicate production records
  test('TEST 13: Offline operator actions synchronize without duplicate production records', async () => {
    const duplicateKey = 'offline-queue-uuid-8899';

    // First offline sync submission
    const res1 = await request(app)
      .post('/api/execution/record')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        plantId,
        workOrderId: testWorkOrderId,
        machineId: testMachineId,
        shiftId: testShiftId,
        operationSequence: 10,
        goodQuantity: 15,
        rejectedQuantity: 0,
        durationMinutes: 15,
        idempotencyKey: duplicateKey
      });
    expect(res1.status).toBe(201);

    // Second replay sync submission with same idempotency key
    const res2 = await request(app)
      .post('/api/execution/record')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        plantId,
        workOrderId: testWorkOrderId,
        machineId: testMachineId,
        shiftId: testShiftId,
        operationSequence: 10,
        goodQuantity: 15,
        rejectedQuantity: 0,
        durationMinutes: 15,
        idempotencyKey: duplicateKey
      });

    // Must return 201 with existing record without duplicating booked quantities
    expect(res2.status).toBe(201);
    expect(res2.body.entry._id).toBe(res1.body.entry._id);

    // Quantity should NOT be double-booked
    const wo = await WorkOrder.findById(testWorkOrderId);
    expect(wo?.completedQuantity).toBe(90); // 75 + 15 (not 75 + 15 + 15)
  });

  // TEST 14: Barcode scanning retrieves the correct production history
  test('TEST 14: Barcode scanning retrieves the correct production history', async () => {
    const res = await request(app)
      .get('/api/traceability/genealogy/WO-E2E-1001')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.genealogy.found).toBe(true);
    expect(res.body.genealogy.workOrder.orderNumber).toBe('WO-E2E-1001');
    expect(res.body.genealogy.operations.length).toBeGreaterThanOrEqual(1);
  });

  // TEST 15: Maintenance work orders update the machine maintenance history
  test('TEST 15: Maintenance work orders update the machine maintenance history', async () => {
    // 1. Create Maintenance Work Order
    const createMoRes = await request(app)
      .post('/api/maintenance/orders')
      .set('Authorization', `Bearer ${maintenanceToken}`)
      .send({
        plantId,
        machineId: testMachineId,
        type: 'Breakdown',
        title: 'Emergency Spindle Re-tooling',
        description: 'Replace worn cutter inserts and calibrate runout',
        scheduledDate: new Date(),
        priority: 'Emergency'
      });

    expect(createMoRes.status).toBe(201);
    const moId = createMoRes.body.order._id;

    // 2. Complete Maintenance Work Order
    const completeMoRes = await request(app)
      .put(`/api/maintenance/orders/${moId}`)
      .set('Authorization', `Bearer ${maintenanceToken}`)
      .send({
        status: 'Completed',
        actionsTaken: 'Inserted new carbide cutters, tested runout < 0.005mm',
        downtimeDurationMinutes: 35
      });

    expect(completeMoRes.status).toBe(200);

    // 3. Verify Machine maintenance dates and state were updated
    const mch = await Machine.findById(testMachineId);
    expect(mch?.lastMaintenanceDate).toBeDefined();
    expect(mch?.nextMaintenanceDate).toBeDefined();
  });
});
