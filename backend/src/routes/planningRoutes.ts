import { Router } from 'express';
import { ProductionPlanningController } from '../controllers/productionPlanningController';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticateJWT);

router.get('/plans', ProductionPlanningController.getPlans);
router.post('/plans', requirePermission('planning:create', '*'), ProductionPlanningController.createPlan);
router.get('/gantt', ProductionPlanningController.getGanttSchedule);
router.post('/update-schedule', requirePermission('planning:edit', 'workorders:edit', '*'), ProductionPlanningController.updateSchedule);

export default router;
