import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticateJWT);

router.get('/', requirePermission('users:manage', '*'), UserController.getUsers);
router.post('/', requirePermission('users:manage', '*'), UserController.createUser);
router.put('/:id', requirePermission('users:manage', '*'), UserController.updateUser);

export default router;
