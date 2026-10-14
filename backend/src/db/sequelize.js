import { Sequelize, DataTypes } from 'sequelize';
import config from '../config/index.js';

let sequelize = null;
let Transaction = null;

export function defineModels(seq) {
  const TransactionModel = seq.define(
    'Transaction',
    {
      order_id: { type: DataTypes.STRING, primaryKey: true },
      transaction_id: DataTypes.STRING,
      payment_type: DataTypes.STRING,
      transaction_status: DataTypes.STRING,
      internal_status: DataTypes.STRING,
      gross_amount: DataTypes.DECIMAL(18, 2),
      currency: { type: DataTypes.STRING, defaultValue: 'IDR' },
      api_flavor: DataTypes.STRING,
      raw: DataTypes.JSON,
    },
    { tableName: 'transactions', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' },
  );

  const WebhookEvent = seq.define(
    'WebhookEvent',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      order_id: DataTypes.STRING,
      transaction_status: DataTypes.STRING,
      verified: DataTypes.BOOLEAN,
      payload: DataTypes.JSON,
    },
    { tableName: 'webhook_events', timestamps: true, createdAt: 'created_at', updatedAt: false },
  );

  return { TransactionModel, WebhookEvent };
}

export async function initDb() {
  const cfg = config.db;
  sequelize =
    cfg.dialect === 'sqlite'
      ? new Sequelize({ dialect: 'sqlite', storage: cfg.storage, logging: cfg.logging || false })
      : new Sequelize(cfg.name, cfg.user, cfg.password, {
          host: cfg.host,
          port: cfg.port,
          dialect: 'mysql',
          logging: cfg.logging || false,
        });

  const { TransactionModel } = defineModels(sequelize);
  Transaction = TransactionModel;

  await sequelize.authenticate();
  await sequelize.sync({ alter: cfg.syncAlter });
  console.log('🗄  Database connected & synced');
  return sequelize;
}

export function getDb() {
  return { sequelize, Transaction };
}

/** Best-effort mirror of an in-memory record to the DB. */
export async function persist(record) {
  if (!sequelize || !Transaction) return;
  try {
    await Transaction.upsert({
      order_id: record.order_id,
      transaction_id: record.transaction_id,
      payment_type: record.payment_type,
      transaction_status: record.transaction_status,
      internal_status: record.internal_status,
      gross_amount: record.gross_amount,
      currency: record.currency || 'IDR',
      api_flavor: record.api_flavor,
      raw: record,
    });
  } catch (e) {
    console.warn('⚠️  persist failed:', e.message);
  }
}

export default { initDb, getDb, persist, defineModels };
