import { Router } from 'express';
import { IntegrationController } from '../controllers/integrationController';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();

// Public webhook receiver (verifies payload/tokens internally)
router.post('/webhook', IntegrationController.receiveWebhook);

// Protected endpoints
router.use(authenticateJWT);

router.get('/configs', IntegrationController.getConfigs);
router.post('/configs', requirePermission('system:configure', '*'), IntegrationController.createConfig);
router.post('/simulation/toggle', requirePermission('system:configure', '*'), IntegrationController.toggleSimulation);
router.post('/erp/import', requirePermission('system:configure', 'inventory:edit', '*'), IntegrationController.importERPBatch);

export default router;
