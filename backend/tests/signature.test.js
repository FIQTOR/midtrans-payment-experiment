import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import {
  basicAuthHeader,
  computeNotificationSignature,
  verifyNotificationSignature,
} from '../src/utils/signature.js';

describe('signature utils', () => {
  const key = 'SB-Mid-server-TESTKEY';

  it('builds a Basic auth header with an empty password', () => {
    const header = basicAuthHeader(key);
    expect(header.startsWith('Basic ')).toBe(true);
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    expect(decoded).toBe(`${key}:`);
  });

  it('computes sha512(order+status+gross+key)', () => {
    const expected = crypto
      .createHash('sha512')
      .update('ORDER-1' + '200' + '49000.00' + key)
      .digest('hex');
    expect(computeNotificationSignature('ORDER-1', '200', '49000.00', key)).toBe(expected);
  });

  it('verifies a valid notification', () => {
    const n = { order_id: 'ORDER-1', status_code: '200', gross_amount: '49000.00' };
    n.signature_key = computeNotificationSignature(n.order_id, n.status_code, n.gross_amount, key);
    expect(verifyNotificationSignature(n, key)).toBe(true);
  });

  it('rejects a tampered notification', () => {
    const n = {
      order_id: 'ORDER-1',
      status_code: '200',
      gross_amount: '49000.00',
      signature_key: 'deadbeef',
    };
    expect(verifyNotificationSignature(n, key)).toBe(false);
  });

  it('rejects when required fields are missing', () => {
    expect(verifyNotificationSignature({ order_id: 'x' }, key)).toBe(false);
  });
});
