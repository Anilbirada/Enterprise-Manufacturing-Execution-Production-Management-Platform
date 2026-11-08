import { Router } from 'express';
import { DowntimeController } from '../controllers/downtimeController';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticateJWT);

router.get('/events', DowntimeController.getDowntimeEvents);
router.post('/report', requirePermission('execution:report_downtime', 'machines:update_status', '*'), DowntimeController.reportDowntime);
router.post('/events/:id/resolve', requirePermission('maintenance:update', 'machines:update_status', 'andon:resolve', '*'), DowntimeController.resolveDowntime);
router.get('/pareto', DowntimeController.getDowntimePareto);

export default router;
