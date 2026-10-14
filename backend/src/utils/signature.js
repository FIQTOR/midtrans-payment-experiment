import crypto from 'node:crypto';

/**
 * Midtrans API auth is HTTP Basic with the Server Key as the username and an
 * empty password: base64("<serverKey>:").
 */
export function basicAuthHeader(serverKey) {
  return `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;
}

/**
 * Midtrans notification signature:
 *   sha512(order_id + status_code + gross_amount + server_key)
 * The result is compared against `signature_key` in the notification body.
 */
export function computeNotificationSignature(orderId, statusCode, grossAmount, serverKey) {
  const payload = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  return crypto.createHash('sha512').update(payload).digest('hex');
}

export function verifyNotificationSignature(notification, serverKey) {
  const { order_id, status_code, gross_amount, signature_key } = notification;
  if (!order_id || !status_code || gross_amount === undefined || !signature_key) {
    return false;
  }
  const expected = computeNotificationSignature(order_id, status_code, String(gross_amount), serverKey);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature_key));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** SHA256withRSA helper (kept for future Iris / 3DS use). */
export function sha256RsaSign(data, privateKeyPem) {
  return crypto.createSign('RSA-SHA256').update(data).sign(privateKeyPem, 'base64');
}
