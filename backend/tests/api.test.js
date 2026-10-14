import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import { transactionStore } from '../src/store/transactions.js';
import { computeNotificationSignature } from '../src/utils/signature.js';
import config from '../src/config/index.js';

describe('HTTP API', () => {
  beforeEach(() => transactionStore.clear());

  it('health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('creates a payment and returns a record', async () => {
    const res = await request(app).post('/api/payments').send({ amount: 25000, channel: 'qris' });
    expect(res.status).toBe(201);
    expect(res.body.order_id).toMatch(/^ORDER-/);
    expect(res.body.internal_status).toBe('PENDING');
  });

  it('rejects invalid payloads', async () => {
    const res = await request(app).post('/api/payments').send({ amount: -1 });
    expect(res.status).toBe(400);
  });

  it('lists and filters payments + stats', async () => {
    await request(app).post('/api/payments').send({ amount: 1000, channel: 'qris' });
    await request(app).post('/api/payments').send({ amount: 2000, channel: 'bca' });
    const list = await request(app).get('/api/payments');
    expect(list.body.count).toBe(2);
    const stats = await request(app).get('/api/payments/stats');
    expect(stats.body.total).toBe(2);
  });

  it('runs the simulate -> refund lifecycle', async () => {
    const created = await request(app).post('/api/payments').send({ amount: 5000, channel: 'qris' });
    const id = created.body.order_id;
    const paid = await request(app).post(`/api/payments/${id}/simulate?status=PAID`);
    expect(paid.body.internal_status).toBe('PAID');
    const refunded = await request(app).post(`/api/payments/${id}/refund`).send({ reason: 'test' });
    expect(refunded.body.internal_status).toBe('REFUNDED');
  });

  it('404s for unknown transactions', async () => {
    const res = await request(app).get('/api/payments/NOPE');
    expect(res.status).toBe(404);
  });

  it('accepts a signed webhook notification', async () => {
    await request(app).post('/api/payments').send({ amount: 12000, channel: 'qris', order_id: 'ORDER-WH1' });
    const amount = '12000.00';
    const body = {
      order_id: 'ORDER-WH1',
      transaction_id: 'tx-1',
      transaction_status: 'settlement',
      status_code: '200',
      gross_amount: amount,
      payment_type: 'qris',
    };
    body.signature_key = computeNotificationSignature(body.order_id, body.status_code, amount, config.midtrans.serverKey);
    const res = await request(app).post('/api/webhooks/midtrans').send(body);
    expect(res.status).toBe(200);
    expect(res.body.internal_status).toBe('PAID');
  });
});
