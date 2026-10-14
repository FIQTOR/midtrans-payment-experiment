import { z } from 'zod';
import { transactionStore } from '../store/transactions.js';
import * as midtransService from '../services/midtransService.js';
import { toDataUrl } from '../utils/qr.js';

const createSchema = z.object({
  amount: z.coerce.number().positive(),
  channel: z
    .enum(['qris', 'va', 'bank_transfer', 'bca', 'bni', 'bri', 'permata', 'gopay', 'shopeepay', 'credit_card', 'card'])
    .default('qris'),
  api_flavor: z.enum(['snap', 'core']).optional(),
  bank: z.string().optional(),
  order_id: z.string().optional(),
  items: z.array(z.any()).optional(),
  customer: z.record(z.any()).optional(),
  callback_url: z.string().url().optional(),
});

export async function createPayment(req, res) {
  const input = createSchema.parse(req.body);
  const tx = await midtransService.createTransaction(input);
  const record = transactionStore.upsert(tx.order_id, {
    ...tx,
    internal_status: tx.internal_status || 'PENDING',
    timelineEvent: { status: tx.internal_status || 'PENDING', note: 'transaction created' },
  });
  res.status(201).json(record);
}

export function listPayments(req, res) {
  const { status, q } = req.query;
  let items = transactionStore.list();
  if (status) items = items.filter((t) => t.internal_status === status);
  if (q) {
    const needle = String(q).toLowerCase();
    items = items.filter(
      (t) =>
        t.order_id.toLowerCase().includes(needle) ||
        String(t.transaction_id || '').toLowerCase().includes(needle),
    );
  }
  res.json({ count: items.length, items });
}

export function getPayment(req, res) {
  const record = transactionStore.get(req.params.orderId);
  if (!record) return res.status(404).json({ error: 'Transaction not found' });
  res.json(record);
}

export function getStats(_req, res) {
  const items = transactionStore.list();
  const sum = (s) =>
    items.filter((t) => t.internal_status === s).reduce((a, t) => a + Number(t.gross_amount || 0), 0);
  res.json({
    total: items.length,
    paid: items.filter((t) => t.internal_status === 'PAID').length,
    pending: items.filter((t) => t.internal_status === 'PENDING').length,
    failed: items.filter((t) => t.internal_status === 'FAILED').length,
    refunded: items.filter((t) => t.internal_status === 'REFUNDED').length,
    grossPaid: sum('PAID'),
    grossPending: sum('PENDING'),
  });
}

export async function queryStatus(req, res) {
  const { orderId } = req.params;
  const record = transactionStore.get(orderId);
  if (!record) return res.status(404).json({ error: 'Transaction not found' });

  const live = await midtransService.getStatus(orderId);
  if (live) {
    return res.json(transactionStore.upsert(orderId, { ...live, mirrored_at: new Date().toISOString() }));
  }
  res.json(record);
}

async function action(req, res, fn, nextStatus, note) {
  const { orderId } = req.params;
  const record = transactionStore.get(orderId);
  if (!record) return res.status(404).json({ error: 'Transaction not found' });

  const live = await fn(orderId);
  const patch = {
    internal_status: nextStatus,
    transaction_status: nextStatus.toLowerCase(),
    timelineEvent: { status: nextStatus, note },
    ...(live ? live : {}),
  };
  res.json(transactionStore.upsert(orderId, patch));
}

export async function cancelPayment(req, res) {
  return action(req, res, midtransService.cancelTransaction, 'FAILED', 'cancelled');
}

export async function expirePayment(req, res) {
  return action(req, res, midtransService.expireTransaction, 'FAILED', 'expired');
}

const refundSchema = z.object({ amount: z.coerce.number().positive().optional(), reason: z.string().optional() });

export async function refundPayment(req, res) {
  const { orderId } = req.params;
  const record = transactionStore.get(orderId);
  if (!record) return res.status(404).json({ error: 'Transaction not found' });
  const { amount, reason } = refundSchema.parse(req.body || {});
  const live = await midtransService.refundTransaction(orderId, { amount, reason });
  res.json(
    transactionStore.upsert(orderId, {
      internal_status: 'REFUNDED',
      transaction_status: 'refund',
      refund_amount: amount ?? record.gross_amount,
      refund_reason: reason || 'requested by merchant',
      timelineEvent: { status: 'REFUNDED', note: reason || 'refund requested' },
      ...(live ? { midtrans_refund: live } : {}),
    }),
  );
}

/** Mock-only helper: advance a pending transaction to a target state. */
export function simulate(req, res) {
  const { orderId } = req.params;
  const target = String(req.query.status || req.body?.status || 'PAID').toUpperCase();
  const allowed = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
  if (!allowed.includes(target)) {
    return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` });
  }
  const record = transactionStore.get(orderId);
  if (!record) return res.status(404).json({ error: 'Transaction not found' });
  res.json(
    transactionStore.upsert(orderId, {
      internal_status: target,
      transaction_status: target === 'PAID' ? 'settlement' : target.toLowerCase(),
      timelineEvent: { status: target, note: 'simulated (mock mode)' },
    }),
  );
}

/** Serve the SSE stream of store changes. */
export function streamEvents(req, res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  res.write('event: ready\ndata: {"ok":true}\n\n');

  const onChange = (payload) => {
    res.write(`event: transaction\ndata: ${JSON.stringify(payload)}\n\n`);
  };
  transactionStore.on('changed', onChange);
  const keepAlive = setInterval(() => res.write(': ping\n\n'), 25_000);

  req.on('close', () => {
    clearInterval(keepAlive);
    transactionStore.off('changed', onChange);
    res.end();
  });
}
