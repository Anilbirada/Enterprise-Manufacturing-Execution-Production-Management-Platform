import { Router } from 'express';
import { ReportsController } from '../controllers/reportsController';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticateJWT);

router.get('/shift', requirePermission('reports:view', '*'), ReportsController.getShiftReport);
router.get('/production-summary', requirePermission('reports:view', '*'), ReportsController.getProductionSummaryReport);

export default router;
