import { IconLayoutDashboard, IconCreditCard, IconWebhook, IconActivity } from '@tabler/icons-react';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { id: 'create', label: 'Create Payment', icon: IconCreditCard },
  { id: 'webhooks', label: 'Webhook Tester', icon: IconWebhook },
];

export default function Sidebar({ tab, onTab, health }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-slate-950/40 p-5">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-100 ring-1 ring-brand-500/30">
          <IconActivity size={22} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">Midtrans Pay</p>
          <p className="text-xs text-slate-400">Experiment Lab</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTab(id)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              tab === id
                ? 'bg-brand-500/20 text-white ring-1 ring-brand-500/30'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${health?.ok ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span className="text-slate-300">{health?.ok ? 'Backend online' : 'Backend offline'}</span>
        </div>
        <p className="mt-2 text-slate-400">
          mode: <span className="text-white">{health?.mockMode ? 'mock' : 'live'}</span>
        </p>
        <p className="text-slate-400">
          flavor: <span className="text-white">{health?.apiFlavor || '—'}</span>
        </p>
      </div>
    </aside>
  );
}
