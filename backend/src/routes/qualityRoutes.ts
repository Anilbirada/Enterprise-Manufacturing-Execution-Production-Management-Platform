import { Router } from 'express';
import { QualityController } from '../controllers/qualityController';
import { authenticateJWT } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticateJWT);

router.get('/plans', QualityController.getPlans);
router.post('/plans', requirePermission('quality:create_plan', '*'), QualityController.createPlan);

router.get('/inspections', QualityController.getInspections);
router.post('/inspections', requirePermission('quality:inspect', '*'), QualityController.recordInspection);

router.get('/ncr', QualityController.getNonConformances);
router.put('/ncr/:id', requirePermission('quality:ncr', 'quality:capa', '*'), QualityController.updateNonConformance);

router.get('/holds', QualityController.getQualityHolds);
router.post('/holds', requirePermission('quality:hold', '*'), QualityController.placeHold);
router.post('/holds/:id/release', requirePermission('quality:release_hold', '*'), QualityController.releaseHold);

export default router;
