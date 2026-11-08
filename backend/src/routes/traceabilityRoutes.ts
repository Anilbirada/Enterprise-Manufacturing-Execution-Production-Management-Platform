import { Router } from 'express';
import { TraceabilityController } from '../controllers/traceabilityController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/genealogy/:code', TraceabilityController.getGenealogy);
router.post('/qrcode', TraceabilityController.generateQRCode);
router.get('/batches', TraceabilityController.getBatches);

export default router;
