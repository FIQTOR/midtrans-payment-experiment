import axios from 'axios';
import { nanoid } from 'nanoid';
import config from '../config/index.js';
import { basicAuthHeader } from '../utils/signature.js';
import { toDataUrl } from '../utils/qr.js';

const { midtrans } = config;

const http = axios.create({
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

function newOrderId() {
  return `${midtrans.orderPrefix}-${nanoid(10).toUpperCase()}`;
}

/** Map a Midtrans transaction_status (+ fraud_status) to our internal state. */
export function mapStatus(transactionStatus, fraudStatus) {
  const ts = String(transactionStatus || '').toLowerCase();
  if (ts === 'capture') return fraudStatus === 'challenge' ? 'PENDING' : 'PAID';
  if (ts === 'settlement') return 'PAID';
  if (ts === 'pending') return 'PENDING';
  if (ts === 'refund' || ts === 'partial_refund') return 'REFUNDED';
  if (['deny', 'cancel', 'expire', 'failure'].includes(ts)) return 'FAILED';
  return 'PENDING';
}

function pickPaymentType(input) {
  // Accept either an explicit payment_type or a friendlier channel keyword.
  const channel = (input.channel || input.payment_type || 'qris').toLowerCase();
  const aliases = {
    qris: 'qris',
    va: 'bank_transfer',
    bank_transfer: 'bank_transfer',
    bca: 'bank_transfer',
    bni: 'bank_transfer',
    bri: 'bank_transfer',
    permata: 'bank_transfer',
    gopay: 'gopay',
    shopeepay: 'shopeepay',
    credit_card: 'credit_card',
    card: 'credit_card',
  };
  const payment_type = aliases[channel] || 'qris';
  const bank = ['bca', 'bni', 'bri', 'permata'].includes(channel) ? channel : input.bank || 'bca';
  return { payment_type, bank, channel };
}

/* ------------------------------------------------------------------ *
 *  MOCK MODE — no network. Deterministic-ish shapes for UI testing.
 * ------------------------------------------------------------------ */
async function mockCreate(input) {
  const order_id = input.order_id || newOrderId();
  const { payment_type, bank, channel } = pickPaymentType(input);
  const gross_amount = Number(input.amount);
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();

  const base = {
    order_id,
    payment_type,
    channel,
    transaction_status: 'pending',
    internal_status: 'PENDING',
    gross_amount,
    currency: 'IDR',
    transaction_id: crypto.randomUUID(),
    expiry_time: expiresAt,
    mock: true,
  };

  if (config.midtrans.apiFlavor === 'snap' && !input.force_core) {
    const token = `mock-snap-${nanoid(20)}`;
    return {
      ...base,
      api_flavor: 'snap',
      token,
      redirect_url: `${config.midtrans.snapBaseUrl}/redirection/${token}`,
    };
  }

  const charge = { ...base, api_flavor: 'core' };
  if (payment_type === 'qris') {
    charge.actions = [{ name: 'generate-qr-code', method: 'GET', url: 'mock://qris' }];
    charge.qr_string = `00020101021226${nanoid(28)}5802ID5913MIDTRANS MOCK6007JAKARTA`;
    charge.qr_data_url = await toDataUrl(charge.qr_string);
  } else if (payment_type === 'bank_transfer') {
    charge.va_numbers = [{ bank, va_number: `${bank.toUpperCase()}${Math.floor(Math.random() * 1e9)}` }];
    charge.bank = bank;
  } else if (payment_type === 'gopay' || payment_type === 'shopeepay') {
    charge.actions = [
      { name: 'deeplink-redirect', method: 'GET', url: `mock://${payment_type}/deeplink` },
    ];
  } else if (payment_type === 'credit_card') {
    charge.redirect_url = `${config.midtrans.snapBaseUrl}/v2/3ds/${order_id}`;
  }
  return charge;
}

/* ------------------------------------------------------------------ *
 *  LIVE MODE — real Midtrans API calls.
 * ------------------------------------------------------------------ */
function authConfig() {
  return { headers: { Authorization: basicAuthHeader(midtrans.serverKey) } };
}

async function liveCreateSnap(input) {
  const order_id = input.order_id || newOrderId();
  const body = {
    transaction_details: { order_id, gross_amount: Number(input.amount) },
    item_details: input.items,
    customer_details: input.customer,
    credit_card: { secure: true },
  };
  const { data } = await http.post(
    `${midtrans.snapBaseUrl}/snap/v1/transactions`,
    body,
    authConfig(),
  );
  return {
    order_id,
    api_flavor: 'snap',
    token: data.token,
    redirect_url: data.redirect_url,
    transaction_status: 'pending',
    internal_status: 'PENDING',
    gross_amount: Number(input.amount),
    currency: 'IDR',
  };
}

async function liveCreateCore(input) {
  const order_id = input.order_id || newOrderId();
  const { payment_type, bank } = pickPaymentType(input);
  const body = {
    payment_type,
    transaction_details: { order_id, gross_amount: Number(input.amount) },
    item_details: input.items,
    customer_details: input.customer,
  };
  if (payment_type === 'bank_transfer') body.bank_transfer = { bank };
  if (payment_type === 'qris') body.qris = { acquirer: 'gopay' };
  if (payment_type === 'gopay') body.gopay = { enable_callback: true, callback_url: input.callback_url };
  if (payment_type === 'credit_card') {
    body.credit_card = { secure: true, authentication: true };
  }
  const { data } = await http.post(`${midtrans.baseUrl}/v2/charge`, body, authConfig());
  const internal_status = mapStatus(data.transaction_status, data.fraud_status);
  const enriched = { ...data, order_id, gross_amount: Number(input.amount) };
  if (data.actions?.some((a) => a.name === 'generate-qr-code')) {
    try {
      enriched.qr_data_url = await toDataUrl(data.actions[0].url);
    } catch {
      /* ignore QR render errors */
    }
  }
  return { ...enriched, api_flavor: 'core', internal_status };
}

export async function createTransaction(input) {
  if (config.mockMode) return mockCreate(input);
  if ((input.api_flavor || midtrans.apiFlavor) === 'snap' && !input.force_core) {
    return liveCreateSnap(input);
  }
  return liveCreateCore(input);
}

export async function getStatus(orderId) {
  if (config.mockMode) return null; // store holds the state in mock mode
  const { data } = await http.get(`${midtrans.baseUrl}/v2/${orderId}/status`, authConfig());
  return { ...data, internal_status: mapStatus(data.transaction_status, data.fraud_status) };
}

export async function cancelTransaction(orderId) {
  if (config.mockMode) return null;
  const { data } = await http.post(`${midtrans.baseUrl}/v2/${orderId}/cancel`, {}, authConfig());
  return { ...data, internal_status: mapStatus(data.transaction_status, data.fraud_status) };
}

export async function expireTransaction(orderId) {
  if (config.mockMode) return null;
  const { data } = await http.post(`${midtrans.baseUrl}/v2/${orderId}/expire`, {}, authConfig());
  return { ...data, internal_status: mapStatus(data.transaction_status, data.fraud_status) };
}

export async function refundTransaction(orderId, { amount, reason }) {
  if (config.mockMode) return null;
  const body = { reason: reason || 'requested by merchant' };
  if (amount) body.refund_amount = Number(amount);
  const { data } = await http.post(`${midtrans.baseUrl}/v2/${orderId}/refund`, body, authConfig());
  return data;
}

/** Simple connectivity self-test used by `npm run midtrans:ping`. */
export async function ping() {
  if (config.mockMode) {
    return { ok: true, mock: true, message: 'Mock mode enabled — no network call made.' };
  }
  try {
    const { data } = await http.get(`${midtrans.snapBaseUrl}/snap/v1/transactions`, authConfig());
    return { ok: true, status: 200, data: typeof data };
  } catch (err) {
    const status = err.response?.status;
    // 401 proves reachability + our auth wiring; any HTTP response = reachable.
    if (status) return { ok: true, status, reachable: true };
    return { ok: false, error: err.message };
  }
}

export { newOrderId };
export default {
  createTransaction,
  getStatus,
  cancelTransaction,
  expireTransaction,
  refundTransaction,
  ping,
  mapStatus,
  newOrderId,
};
