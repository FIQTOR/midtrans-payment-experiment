import { describe, it, expect, beforeEach } from 'vitest';
import { transactionStore } from '../src/store/transactions.js';

describe('transactionStore', () => {
  beforeEach(() => transactionStore.clear());

  it('upserts and reads records', () => {
    transactionStore.upsert('A', { gross_amount: 100, internal_status: 'PENDING' });
    expect(transactionStore.get('A').gross_amount).toBe(100);
    expect(transactionStore.get('missing')).toBeNull();
  });

  it('appends timeline events', () => {
    transactionStore.upsert('B', { gross_amount: 1, timelineEvent: { status: 'PENDING' } });
    transactionStore.upsert('B', { internal_status: 'PAID', timelineEvent: { status: 'PAID' } });
    const rec = transactionStore.get('B');
    expect(rec.timeline).toHaveLength(2);
    expect(rec.internal_status).toBe('PAID');
  });

  it('lists newest first and emits change events', () => {
    const seen = [];
    transactionStore.on('changed', (e) => seen.push(e.type));
    transactionStore.upsert('C', { gross_amount: 5 });
    expect(transactionStore.list()).toHaveLength(1);
    expect(seen).toContain('upsert');
  });
});
