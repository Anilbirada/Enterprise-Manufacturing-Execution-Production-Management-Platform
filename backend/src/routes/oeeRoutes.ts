import { Router } from 'express';
import { OEEController } from '../controllers/oeeController';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticateJWT);

router.get('/plant', OEEController.getPlantOEE);
router.get('/machine/:machineId', OEEController.getMachineOEE);
router.get('/machines-comparison', OEEController.getMachinesOEEComparison);
router.get('/settings', OEEController.getKPISettings);
router.put('/settings', requirePermission('oee:configure', 'system:configure', '*'), OEEController.updateKPISettings);

export default router;
