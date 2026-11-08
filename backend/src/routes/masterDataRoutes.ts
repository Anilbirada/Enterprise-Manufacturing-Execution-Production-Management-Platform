import { Router } from 'express';
import { MasterDataController } from '../controllers/masterDataController';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticateJWT);

// Organizations & Sites & Plants
router.get('/organizations', MasterDataController.getOrganizations);
router.post('/organizations', requirePermission('system:configure', '*'), MasterDataController.createOrganization);

router.get('/sites', MasterDataController.getSites);
router.post('/sites', requirePermission('system:configure', '*'), MasterDataController.createSite);

router.get('/plants', MasterDataController.getPlants);
router.post('/plants', requirePermission('system:configure', '*'), MasterDataController.createPlant);

router.get('/departments', MasterDataController.getDepartments);
router.post('/departments', requirePermission('system:configure', '*'), MasterDataController.createDepartment);

// Lines
router.get('/lines', MasterDataController.getProductionLines);
router.post('/lines', requirePermission('lines:edit', 'system:configure', '*'), MasterDataController.createProductionLine);
router.put('/lines/:id', requirePermission('lines:edit', 'system:configure', '*'), MasterDataController.updateProductionLine);

// Machines
router.get('/machines', MasterDataController.getMachines);
router.post('/machines', requirePermission('machines:edit', 'system:configure', '*'), MasterDataController.createMachine);
router.put('/machines/:id', requirePermission('machines:edit', 'machines:update_status', 'system:configure', '*'), MasterDataController.updateMachine);

// Products
router.get('/products', MasterDataController.getProducts);
router.post('/products', requirePermission('products:edit', 'system:configure', '*'), MasterDataController.createProduct);
router.put('/products/:id', requirePermission('products:edit', 'system:configure', '*'), MasterDataController.updateProduct);

// Materials
router.get('/materials', MasterDataController.getMaterials);
router.post('/materials', requirePermission('inventory:edit', 'system:configure', '*'), MasterDataController.createMaterial);

// BOM
router.get('/boms', MasterDataController.getBOMs);
router.post('/boms', requirePermission('boms:edit', 'system:configure', '*'), MasterDataController.createBOM);

// Routings
router.get('/routings', MasterDataController.getRoutings);
router.post('/routings', requirePermission('routings:edit', 'system:configure', '*'), MasterDataController.createRouting);

// Shifts
router.get('/shifts', MasterDataController.getShifts);
router.post('/shifts', requirePermission('shifts:edit', 'system:configure', '*'), MasterDataController.createShift);

export default router;
