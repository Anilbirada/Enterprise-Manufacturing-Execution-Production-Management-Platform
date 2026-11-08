import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
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
import { logAudit } from '../middlewares/audit';

export class MasterDataController {
  // Organizations
  public static async getOrganizations(req: AuthenticatedRequest, res: Response) {
    const list = await Organization.find({ active: true });
    res.json({ success: true, list });
  }

  public static async createOrganization(req: AuthenticatedRequest, res: Response) {
    const org = await Organization.create(req.body);
    await logAudit(req, 'CREATE_ORGANIZATION', 'Organization', org._id.toString(), undefined, req.body);
    res.status(201).json({ success: true, org });
  }

  // Sites
  public static async getSites(req: AuthenticatedRequest, res: Response) {
    const list = await Site.find({ active: true }).populate('organizationId', 'name code');
    res.json({ success: true, list });
  }

  public static async createSite(req: AuthenticatedRequest, res: Response) {
    const site = await Site.create(req.body);
    await logAudit(req, 'CREATE_SITE', 'Site', site._id.toString(), undefined, req.body);
    res.status(201).json({ success: true, site });
  }

  // Plants
  public static async getPlants(req: AuthenticatedRequest, res: Response) {
    const list = await Plant.find({ active: true }).populate('siteId', 'name code');
    res.json({ success: true, list });
  }

  public static async createPlant(req: AuthenticatedRequest, res: Response) {
    const plant = await Plant.create(req.body);
    await logAudit(req, 'CREATE_PLANT', 'Plant', plant._id.toString(), undefined, req.body);
    res.status(201).json({ success: true, plant });
  }

  // Departments
  public static async getDepartments(req: AuthenticatedRequest, res: Response) {
    const filter = req.plantId ? { plantId: req.plantId } : {};
    const list = await Department.find(filter).populate('plantId', 'name code');
    res.json({ success: true, list });
  }

  public static async createDepartment(req: AuthenticatedRequest, res: Response) {
    const dept = await Department.create({ ...req.body, plantId: req.body.plantId || req.plantId });
    await logAudit(req, 'CREATE_DEPARTMENT', 'Department', dept._id.toString(), undefined, req.body);
    res.status(201).json({ success: true, dept });
  }

  // Production Lines
  public static async getProductionLines(req: AuthenticatedRequest, res: Response) {
    const filter: any = { active: true };
    if (req.plantId) filter.plantId = req.plantId;
    const list = await ProductionLine.find(filter)
      .populate('plantId', 'name code')
      .populate('departmentId', 'name')
      .populate('currentWorkOrderId', 'orderNumber plannedQuantity completedQuantity status');
    res.json({ success: true, count: list.length, list });
  }

  public static async createProductionLine(req: AuthenticatedRequest, res: Response) {
    const line = await ProductionLine.create({ ...req.body, plantId: req.body.plantId || req.plantId });
    await logAudit(req, 'CREATE_PRODUCTION_LINE', 'ProductionLine', line._id.toString(), undefined, req.body);
    res.status(201).json({ success: true, line });
  }

  public static async updateProductionLine(req: AuthenticatedRequest, res: Response) {
    const line = await ProductionLine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAudit(req, 'UPDATE_PRODUCTION_LINE', 'ProductionLine', req.params.id, undefined, req.body);
    res.json({ success: true, line });
  }

  // Machines
  public static async getMachines(req: AuthenticatedRequest, res: Response) {
    const filter: any = { active: true };
    if (req.plantId) filter.plantId = req.plantId;
    const list = await Machine.find(filter)
      .populate('plantId', 'name code')
      .populate('productionLineId', 'name code')
      .populate('currentWorkOrderId', 'orderNumber plannedQuantity completedQuantity')
      .populate('currentOperatorId', 'name email');
    res.json({ success: true, count: list.length, list });
  }

  public static async createMachine(req: AuthenticatedRequest, res: Response) {
    const machine = await Machine.create({ ...req.body, plantId: req.body.plantId || req.plantId });
    await logAudit(req, 'CREATE_MACHINE', 'Machine', machine._id.toString(), undefined, req.body);
    res.status(201).json({ success: true, machine });
  }

  public static async updateMachine(req: AuthenticatedRequest, res: Response) {
    const machine = await Machine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAudit(req, 'UPDATE_MACHINE', 'Machine', req.params.id, undefined, req.body);
    res.json({ success: true, machine });
  }

  // Products
  public static async getProducts(req: AuthenticatedRequest, res: Response) {
    const filter: any = { active: true };
    if (req.plantId) filter.plantId = req.plantId;
    const list = await Product.find(filter).populate('plantId', 'name code');
    res.json({ success: true, count: list.length, list });
  }

  public static async createProduct(req: AuthenticatedRequest, res: Response) {
    const product = await Product.create({ ...req.body, plantId: req.body.plantId || req.plantId });
    await logAudit(req, 'CREATE_PRODUCT', 'Product', product._id.toString(), undefined, req.body);
    res.status(201).json({ success: true, product });
  }

  public static async updateProduct(req: AuthenticatedRequest, res: Response) {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAudit(req, 'UPDATE_PRODUCT', 'Product', req.params.id, undefined, req.body);
    res.json({ success: true, product });
  }

  // Materials
  public static async getMaterials(req: AuthenticatedRequest, res: Response) {
    const filter: any = { active: true };
    if (req.plantId) filter.plantId = req.plantId;
    const list = await Material.find(filter).populate('plantId', 'name code');
    res.json({ success: true, count: list.length, list });
  }

  public static async createMaterial(req: AuthenticatedRequest, res: Response) {
    const mat = await Material.create({ ...req.body, plantId: req.body.plantId || req.plantId });
    await logAudit(req, 'CREATE_MATERIAL', 'Material', mat._id.toString(), undefined, req.body);
    res.status(201).json({ success: true, material: mat });
  }

  // BOMs
  public static async getBOMs(req: AuthenticatedRequest, res: Response) {
    const filter: any = { active: true };
    if (req.plantId) filter.plantId = req.plantId;
    const list = await BOM.find(filter)
      .populate('productId', 'name code category uom')
      .populate('items.materialId', 'name code category uom currentStock');
    res.json({ success: true, count: list.length, list });
  }

  public static async createBOM(req: AuthenticatedRequest, res: Response) {
    const bom = await BOM.create({ ...req.body, plantId: req.body.plantId || req.plantId });
    await logAudit(req, 'CREATE_BOM', 'BOM', bom._id.toString(), undefined, req.body);
    res.status(201).json({ success: true, bom });
  }

  // Routings
  public static async getRoutings(req: AuthenticatedRequest, res: Response) {
    const filter: any = { active: true };
    if (req.plantId) filter.plantId = req.plantId;
    const list = await Routing.find(filter)
      .populate('productId', 'name code')
      .populate('operations.workstationId', 'name code');
    res.json({ success: true, count: list.length, list });
  }

  public static async createRouting(req: AuthenticatedRequest, res: Response) {
    const routing = await Routing.create({ ...req.body, plantId: req.body.plantId || req.plantId });
    await logAudit(req, 'CREATE_ROUTING', 'Routing', routing._id.toString(), undefined, req.body);
    res.status(201).json({ success: true, routing });
  }

  // Shifts
  public static async getShifts(req: AuthenticatedRequest, res: Response) {
    const filter: any = { active: true };
    if (req.plantId) filter.plantId = req.plantId;
    const list = await Shift.find(filter).populate('plantId', 'name code');
    res.json({ success: true, count: list.length, list });
  }

  public static async createShift(req: AuthenticatedRequest, res: Response) {
    const shift = await Shift.create({ ...req.body, plantId: req.body.plantId || req.plantId });
    await logAudit(req, 'CREATE_SHIFT', 'Shift', shift._id.toString(), undefined, req.body);
    res.status(201).json({ success: true, shift });
  }
}
