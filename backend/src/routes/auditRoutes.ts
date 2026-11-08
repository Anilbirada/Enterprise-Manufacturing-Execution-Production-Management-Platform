import { Router } from 'express';
import { AuditController } from '../controllers/auditController';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticateJWT);

router.get('/', requirePermission('audit:view', 'system:configure', '*'), AuditController.getAuditLogs);

export default router;
