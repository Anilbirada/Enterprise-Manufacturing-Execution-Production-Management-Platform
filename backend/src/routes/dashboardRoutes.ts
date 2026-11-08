import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/realtime', DashboardController.getRealtimeDashboard);

export default router;
