import { Router } from 'express';
import { MaintenanceController } from '../controllers/maintenanceController';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticateJWT);

router.get('/orders', MaintenanceController.getMaintenanceOrders);
router.post('/orders', requirePermission('maintenance:create', '*'), MaintenanceController.createMaintenanceOrder);
router.put('/orders/:id', requirePermission('maintenance:update', 'maintenance:close', '*'), MaintenanceController.updateMaintenanceOrder);

export default router;
