const BASE = import.meta.env.VITE_API_BASE || '/api';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = data?.details;
    throw err;
  }
  return data;
}

export const api = {
  health: () => req('/health'),
  getConfig: () => req('/config'),
  stats: () => req('/payments/stats'),
  listPayments: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return req(`/payments${qs ? `?${qs}` : ''}`);
  },
  getPayment: (id) => req(`/payments/${id}`),
  createPayment: (body) => req('/payments', { method: 'POST', body: JSON.stringify(body) }),
  queryStatus: (id) => req(`/payments/${id}/status`),
  cancel: (id) => req(`/payments/${id}/cancel`, { method: 'POST' }),
  expire: (id) => req(`/payments/${id}/expire`, { method: 'POST' }),
  refund: (id, body) => req(`/payments/${id}/refund`, { method: 'POST', body: JSON.stringify(body || {}) }),
  simulate: (id, status) => req(`/payments/${id}/simulate?status=${status}`, { method: 'POST' }),
};

export const publicConfig = () =>
  fetch(`${BASE}/config`).then((r) => r.json());

export const idr = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(n || 0),
  );

export default api;
