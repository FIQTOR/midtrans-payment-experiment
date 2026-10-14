import { useState } from 'react';
import Modal from './Modal.jsx';
import StatusBadge from './StatusBadge.jsx';
import SnapPopupButton from './SnapPopupButton.jsx';
import { api, idr } from '../lib/api.js';

function Field({ label, value, mono }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`mt-0.5 break-all text-sm text-white ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</dd>
    </div>
  );
}

export default function PaymentDetailModal({ tx, onClose, onChanged, onToast, mockMode, clientKey }) {
  const [busy, setBusy] = useState('');

  if (!tx) return null;

  const run = async (label, fn) => {
    setBusy(label);
    try {
      const updated = await fn();
      onToast?.({ type: 'success', message: `${label} ok` });
      onChanged?.(updated);
    } catch (err) {
      onToast?.({ type: 'error', message: err.message });
    } finally {
      setBusy('');
    }
  };

  const va = tx.va_numbers?.[0]?.va_number;
  const qr = tx.qr_data_url;

  return (
    <Modal open={!!tx} onClose={onClose} title="Payment detail" wide>
      <div className="mb-4 flex items-center gap-3">
        <StatusBadge status={tx.internal_status} />
        <span className="font-mono text-sm text-slate-300">{tx.order_id}</span>
        {tx.mock && <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">mock</span>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-4">
            <Field label="Amount" value={idr(tx.gross_amount)} />
            <Field label="Payment type" value={tx.payment_type} />
            <Field label="Transaction ID" value={tx.transaction_id} mono />
            <Field label="API flavor" value={tx.api_flavor || '—'} />
            <Field label="Virtual Account" value={va} mono />
            <Field label="Expiry" value={tx.expiry_time ? new Date(tx.expiry_time).toLocaleString('id-ID') : '—'} />
          </dl>

          {tx.redirect_url && (
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={tx.redirect_url}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"
              >
                Open hosted checkout ↗
              </a>
              {tx.api_flavor === 'snap' && (
                <SnapPopupButton
                  token={tx.token}
                  clientKey={clientKey}
                  mock={mockMode}
                  redirectUrl={tx.redirect_url}
                />
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => run('Query status', () => api.queryStatus(tx.order_id))}
              disabled={!!busy}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/5 disabled:opacity-50"
            >
              Query status
            </button>
            <button
              onClick={() => run('Cancel', () => api.cancel(tx.order_id))}
              disabled={!!busy}
              className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => run('Expire', () => api.expire(tx.order_id))}
              disabled={!!busy}
              className="rounded-lg border border-amber-500/30 px-3 py-2 text-xs text-amber-200 hover:bg-amber-500/10 disabled:opacity-50"
            >
              Expire
            </button>
            <button
              onClick={() => run('Refund', () => api.refund(tx.order_id, { reason: 'refund via dashboard' }))}
              disabled={!!busy}
              className="rounded-lg border border-sky-500/30 px-3 py-2 text-xs text-sky-200 hover:bg-sky-500/10 disabled:opacity-50"
            >
              Refund
            </button>
            {mockMode && (
              <button
                onClick={() => run('Simulate paid', () => api.simulate(tx.order_id, 'PAID'))}
                disabled={!!busy}
                className="rounded-lg border border-emerald-500/30 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50"
              >
                Simulate paid
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {qr && (
            <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white p-4">
              <img src={qr} alt="QRIS" className="h-48 w-48" />
              <p className="mt-2 text-xs text-slate-500">Scan to pay (QRIS)</p>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Timeline</p>
            <ol className="space-y-2">
              {(tx.timeline || []).map((ev, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="h-2 w-2 rounded-full bg-brand-400" />
                  <span className="text-slate-300">{ev.note}</span>
                  <span className="ml-auto text-xs text-slate-500">
                    {new Date(ev.at).toLocaleTimeString('id-ID')}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Modal>
  );
}
