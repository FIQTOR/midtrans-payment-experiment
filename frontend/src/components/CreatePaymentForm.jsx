import { useState } from 'react';
import { IconBolt } from '@tabler/icons-react';

const CHANNELS = [
  { id: 'qris', label: 'QRIS', group: 'core' },
  { id: 'bca', label: 'BCA VA', group: 'core' },
  { id: 'bni', label: 'BNI VA', group: 'core' },
  { id: 'bri', label: 'BRI VA', group: 'core' },
  { id: 'permata', label: 'Permata VA', group: 'core' },
  { id: 'gopay', label: 'GoPay', group: 'core' },
  { id: 'shopeepay', label: 'ShopeePay', group: 'core' },
  { id: 'credit_card', label: 'Credit Card', group: 'core' },
];

export default function CreatePaymentForm({ onCreate, busy }) {
  const [amount, setAmount] = useState(49000);
  const [channel, setChannel] = useState('qris');
  const [flavor, setFlavor] = useState('snap');

  const submit = (e) => {
    e.preventDefault();
    onCreate({
      amount: Number(amount),
      channel,
      api_flavor: flavor,
      force_core: flavor === 'core',
    });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="mb-4 text-sm font-semibold text-white">Create payment</h2>

      <label className="mb-1 block text-xs font-medium text-slate-400">Amount (IDR)</label>
      <input
        type="number"
        min="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mb-4 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
      />

      <label className="mb-1 block text-xs font-medium text-slate-400">API flavor</label>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {['snap', 'core'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFlavor(f)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              flavor === f
                ? 'bg-brand-500/20 text-white ring-1 ring-brand-500/40'
                : 'bg-slate-900/60 text-slate-300 hover:text-white'
            }`}
          >
            {f === 'snap' ? 'Snap' : 'Core API'}
          </button>
        ))}
      </div>

      <label className="mb-1 block text-xs font-medium text-slate-400">Channel</label>
      <div className="mb-5 grid grid-cols-2 gap-2">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={flavor === 'snap'}
            onClick={() => setChannel(c.id)}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition disabled:opacity-40 ${
              channel === c.id
                ? 'bg-brand-500/20 text-white ring-1 ring-brand-500/40'
                : 'bg-slate-900/60 text-slate-300 hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-50"
      >
        <IconBolt size={16} />
        {busy ? 'Creating…' : 'Create payment'}
      </button>
      {flavor === 'snap' && (
        <p className="mt-2 text-center text-xs text-slate-400">
          Snap returns a token + redirect URL for the hosted checkout.
        </p>
      )}
    </form>
  );
}
