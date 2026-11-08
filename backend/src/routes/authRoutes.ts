import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.get('/setup-status', AuthController.checkSetupStatus);
router.post('/setup-admin', AuthController.setupFirstAdmin);
router.post('/login', AuthController.login);
router.get('/me', authenticateJWT, AuthController.getCurrentUser);

export default router;
