import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', NotificationController.getNotifications);
router.put('/:id/read', NotificationController.markRead);
router.post('/mark-all-read', NotificationController.markAllRead);

export default router;
