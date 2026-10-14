import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment schema. Everything is optional-with-default so the app boots in
 * mock mode with zero configuration.
 */
const bool = (def) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined ? def : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())));

const num = (def) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : Number(v)))
    .refine((v) => Number.isFinite(v), { message: 'must be a number' });

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: num(4011),
  CORS_ORIGIN: z.string().default('http://localhost:5175'),

  MIDTRANS_SERVER_KEY: z.string().default('SB-Mid-server-xxxxxxxxxxxxxxxxxxxx'),
  MIDTRANS_CLIENT_KEY: z.string().default('SB-Mid-client-xxxxxxxxxxxxxxxxxxxx'),
  MIDTRANS_BASE_URL: z.string().default('https://api.sandbox.midtrans.com'),
  MIDTRANS_SNAP_BASE_URL: z.string().default('https://app.sandbox.midtrans.com'),
  MIDTRANS_ORDER_PREFIX: z.string().default('ORDER'),
  MIDTRANS_API_FLAVOR: z.enum(['snap', 'core']).default('snap'),

  PUBLIC_BASE_URL: z.string().default('http://localhost:4011'),
  MIDTRANS_MOCK_MODE: bool(true),
  RATE_LIMIT_MAX: num(120),

  DB_ENABLED: bool(false),
  DB_DIALECT: z.enum(['mysql', 'sqlite']).default('mysql'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: num(3306),
  DB_NAME: z.string().default('midtrans_payments'),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_STORAGE: z.string().default(':memory:'),
  DB_LOGGING: bool(false),
  DB_SYNC_ALTER: bool(false),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  port: env.PORT,
  corsOrigins: env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),

  midtrans: {
    serverKey: env.MIDTRANS_SERVER_KEY,
    clientKey: env.MIDTRANS_CLIENT_KEY,
    baseUrl: env.MIDTRANS_BASE_URL.replace(/\/+$/, ''),
    snapBaseUrl: env.MIDTRANS_SNAP_BASE_URL.replace(/\/+$/, ''),
    orderPrefix: env.MIDTRANS_ORDER_PREFIX,
    apiFlavor: env.MIDTRANS_API_FLAVOR,
  },

  publicBaseUrl: env.PUBLIC_BASE_URL.replace(/\/+$/, ''),
  mockMode: env.MIDTRANS_MOCK_MODE,
  rateLimitMax: env.RATE_LIMIT_MAX,

  db: {
    enabled: env.DB_ENABLED,
    dialect: env.DB_DIALECT,
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    storage: env.DB_STORAGE,
    logging: env.DB_LOGGING,
    syncAlter: env.DB_SYNC_ALTER,
  },
};

export default config;
