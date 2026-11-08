import { Router } from 'express';
import { AndonController } from '../controllers/andonController';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticateJWT);

router.get('/board', AndonController.getAndonBoard);
router.post('/report', requirePermission('andon:create', 'execution:report_downtime', '*'), AndonController.reportIssue);
router.post('/:id/acknowledge', requirePermission('andon:acknowledge', 'shifts:view', '*'), AndonController.acknowledgeIssue);
router.post('/:id/resolve', requirePermission('andon:resolve', 'maintenance:update', '*'), AndonController.resolveIssue);
router.post('/:id/escalate', requirePermission('andon:escalate', '*'), AndonController.escalateIssue);

export default router;
