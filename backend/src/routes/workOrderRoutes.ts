import { Router } from 'express';
import { WorkOrderController } from '../controllers/workOrderController';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticateJWT);

router.get('/', WorkOrderController.getWorkOrders);
router.get('/:id', WorkOrderController.getWorkOrderById);
router.post('/', requirePermission('workorders:create', 'planning:create', '*'), WorkOrderController.createWorkOrder);
router.put('/:id', requirePermission('workorders:edit', 'planning:edit', '*'), WorkOrderController.updateWorkOrder);
router.post('/:id/transition', requirePermission('workorders:release', 'workorders:edit', 'production:approve', '*'), WorkOrderController.transitionStatus);

export default router;
