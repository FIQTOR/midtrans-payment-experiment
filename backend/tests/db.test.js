import { describe, it, expect } from 'vitest';
import { Sequelize } from 'sequelize';
import { defineModels } from '../src/db/sequelize.js';

describe('sequelize models (sqlite in-memory)', () => {
  it('defines and syncs Transaction + WebhookEvent', async () => {
    const seq = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    const { TransactionModel, WebhookEvent } = defineModels(seq);
    await seq.sync({ force: true });

    await TransactionModel.create({ order_id: 'ORDER-DB1', gross_amount: 1000, internal_status: 'PAID' });
    const found = await TransactionModel.findByPk('ORDER-DB1');
    expect(found.internal_status).toBe('PAID');

    await WebhookEvent.create({ order_id: 'ORDER-DB1', payload: { a: 1 } });
    expect(await WebhookEvent.count()).toBe(1);
    await seq.close();
  });
});
