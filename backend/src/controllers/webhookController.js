import config from '../config/index.js';
import { transactionStore } from '../store/transactions.js';
import { verifyNotificationSignature } from '../utils/signature.js';
import * as midtransService from '../services/midtransService.js';

/**
 * Midtrans HTTP notification receiver.
 * Docs: https://docs.midtrans.com/docs/https-notification-webhooks
 */
export function receiveNotification(req, res) {
  const notification = req.body || {};
  const verified = verifyNotificationSignature(notification, config.midtrans.serverKey);

  // In mock mode we cannot verify a real signature — accept but flag it.
  if (!verified && !config.mockMode) {
    return res.status(401).json({ error: 'Invalid notification signature' });
  }

  const internal = midtransService.mapStatus(
    notification.transaction_status,
    notification.fraud_status,
  );
  const existing = transactionStore.get(notification.order_id);

  const record = transactionStore.upsert(notification.order_id, {
    ...(existing || {}),
    order_id: notification.order_id,
    transaction_id: notification.transaction_id,
    payment_type: notification.payment_type,
    transaction_status: notification.transaction_status,
    fraud_status: notification.fraud_status,
    internal_status: internal,
    gross_amount: Number(notification.gross_amount || existing?.gross_amount || 0),
    notification_verified: verified,
    notification_received_at: new Date().toISOString(),
    timelineEvent: {
      status: internal,
      note: `webhook: ${notification.transaction_status}${notification.fraud_status ? ` (${notification.fraud_status})` : ''}`,
    },
  });

  res.status(200).json({ ok: true, order_id: record.order_id, internal_status: record.internal_status });
}
