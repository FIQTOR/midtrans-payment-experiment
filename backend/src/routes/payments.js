import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import * as ctrl from '../controllers/paymentController.js';

const router = Router();

router.get('/', ctrl.listPayments);
router.get('/stats', ctrl.getStats);
router.get('/events', ctrl.streamEvents);
router.post('/', asyncHandler(ctrl.createPayment));

router.get('/:orderId', ctrl.getPayment);
router.get('/:orderId/status', asyncHandler(ctrl.queryStatus));
router.post('/:orderId/cancel', asyncHandler(ctrl.cancelPayment));
router.post('/:orderId/expire', asyncHandler(ctrl.expirePayment));
router.post('/:orderId/refund', asyncHandler(ctrl.refundPayment));
router.post('/:orderId/simulate', ctrl.simulate);

export default router;
