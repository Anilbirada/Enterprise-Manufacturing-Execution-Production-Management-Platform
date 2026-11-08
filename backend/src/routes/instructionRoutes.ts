import { Router } from 'express';
import { WorkInstructionController } from '../controllers/workInstructionController';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticateJWT);

router.get('/', WorkInstructionController.getInstructions);
router.get('/:id', WorkInstructionController.getInstructionById);
router.post('/', requirePermission('workinstructions:edit', 'system:configure', '*'), WorkInstructionController.createInstruction);
router.post('/:id/sign-off', WorkInstructionController.signOff);

export default router;
