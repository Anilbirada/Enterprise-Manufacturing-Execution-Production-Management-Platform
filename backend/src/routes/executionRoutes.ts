import { Router } from 'express';
import { ProductionExecutionController } from '../controllers/productionExecutionController';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticateJWT);

router.get('/jobs', ProductionExecutionController.getOperatorJobs);
router.post('/record', requirePermission('execution:record_qty', 'execution:start', '*'), ProductionExecutionController.recordProduction);
router.get('/entries', ProductionExecutionController.getProductionEntries);

export default router;
