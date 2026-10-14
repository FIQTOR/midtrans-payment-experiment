import { Router } from 'express';
import { rawBody, parseJsonRaw } from '../middlewares/rawBody.js';
import { receiveNotification } from '../controllers/webhookController.js';

const router = Router();

// raw body first (so we can verify exact bytes), then JSON parse.
router.post('/midtrans', rawBody, parseJsonRaw, receiveNotification);

export default router;
