import { useState } from 'react';
import { IconCopy, IconSend } from '@tabler/icons-react';

export default function WebhookTester({ config, onToast }) {
  const endpoint =
    config?.webhookUrl || (typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/midtrans` : '');

  const [payload, setPayload] = useState(
    JSON.stringify(
      {
        order_id: 'ORDER-DEMO-1',
        transaction_id: 'tx-demo-1',
        transaction_status: 'settlement',
        status_code: '200',
        gross_amount: '49000.00',
        payment_type: 'qris',
        fraud_status: 'accept',
        signature_key: '(set when not in mock mode)',
      },
      null,
      2,
    ),
  );

  const copy = async () => {
    await navigator.clipboard.writeText(endpoint);
    onToast?.({ type: 'success', message: 'Endpoint copied' });
  };

  const fire = async () => {
    try {
      const body = JSON.parse(payload);
      const res = await fetch('/api/webhooks/midtrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      onToast?.({ type: 'success', message: `Webhook accepted → ${data.internal_status}` });
    } catch (err) {
      onToast?.({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="mb-4 text-sm font-semibold text-white">Webhook tester</h2>

      <label className="mb-1 block text-xs font-medium text-slate-400">Notification endpoint</label>
      <div className="mb-5 flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-200">
          {endpoint}
        </code>
        <button onClick={copy} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5">
          <IconCopy size={16} />
        </button>
      </div>

      <label className="mb-1 block text-xs font-medium text-slate-400">Payload (JSON)</label>
      <textarea
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        rows={12}
        spellCheck={false}
        className="mb-4 w-full rounded-lg border border-white/10 bg-slate-950/70 p-3 font-mono text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
      />

      <button
        onClick={fire}
        className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
      >
        <IconSend size={16} /> Fire notification
      </button>
      <p className="mt-2 text-xs text-slate-400">
        In live mode, include a valid <code>signature_key</code> = sha512(order_id + status_code + gross_amount + server_key).
      </p>
    </div>
  );
}
