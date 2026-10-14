import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import config from './config/index.js';
import paymentsRouter from './routes/payments.js';
import webhooksRouter from './routes/webhooks.js';
import { notFound, errorHandler } from './middlewares/error.js';
import { transactionStore } from './store/transactions.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
        return cb(null, true);
      }
      cb(null, true); // permissive in this experiment; tighten for production
    },
  }),
);
app.use(morgan(config.isProd ? 'combined' : 'dev'));

// Webhooks need the raw body; everything else is JSON.
app.use('/api/webhooks', express.json({ limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', rateLimit({ windowMs: 60_000, max: config.rateLimitMax, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) =>
  res.json({
    ok: true,
    service: 'midtrans-payment-backend',
    env: config.env,
    mockMode: config.mockMode,
    apiFlavor: config.midtrans.apiFlavor,
    time: new Date().toISOString(),
  }),
);

app.get('/api/config', (_req, res) =>
  res.json({
    clientKey: config.midtrans.clientKey,
    snapBaseUrl: config.midtrans.snapBaseUrl,
    mockMode: config.mockMode,
    apiFlavor: config.midtrans.apiFlavor,
    webhookUrl: `${config.publicBaseUrl}/api/webhooks/midtrans`,
  }),
);

app.use('/api/payments', paymentsRouter);
app.use('/api/webhooks', webhooksRouter);

app.use(notFound);
app.use(errorHandler);

if (config.db.enabled) {
  // Lazy-init optional persistence so boot never blocks on a DB outage.
  import('./db/sequelize.js')
    .then(({ initDb, persist }) => {
      initDb()
        .then(() => {
          // Mirror every store change to the DB once persistence is ready.
          transactionStore.on('changed', (evt) => {
            if (evt?.type === 'upsert' && evt.transaction) persist(evt.transaction);
          });
        })
        .catch((e) => console.warn('⚠️  DB init failed:', e.message));
    })
    .catch(() => {});
}

const server = app.listen(config.port, () => {
  console.log(`\n🚀 Midtrans backend on http://localhost:${config.port}`);
  console.log(`   mock mode : ${config.mockMode ? 'ON (no network)' : 'OFF (live API)'}`);
  console.log(`   api flavor: ${config.midtrans.apiFlavor}`);
  console.log(`   webhook   : ${config.publicBaseUrl}/api/webhooks/midtrans\n`);
});

export default app;
export { app, server };
