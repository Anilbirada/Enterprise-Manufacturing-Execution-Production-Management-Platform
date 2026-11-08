import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticateJWT);

router.get('/summary', InventoryController.getStockSummary);
router.post('/transaction', requirePermission('inventory:receive', 'inventory:issue', 'inventory:adjust', '*'), InventoryController.recordTransaction);
router.get('/transactions', InventoryController.getTransactions);

export default router;
