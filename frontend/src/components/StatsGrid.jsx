import { IconCircleCheck, IconClock, IconAlertTriangle, IconArrowBackUp, IconCash } from '@tabler/icons-react';
import { idr } from '../lib/api.js';

const CARDS = [
  { key: 'paid', label: 'Paid', icon: IconCircleCheck, tone: 'text-emerald-300' },
  { key: 'pending', label: 'Pending', icon: IconClock, tone: 'text-amber-300' },
  { key: 'failed', label: 'Failed', icon: IconAlertTriangle, tone: 'text-rose-300' },
  { key: 'refunded', label: 'Refunded', icon: IconArrowBackUp, tone: 'text-sky-300' },
];

export default function StatsGrid({ stats }) {
  const s = stats || {};
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, tone }) => (
        <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
            <Icon size={18} className={tone} />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{s[key] ?? 0}</p>
        </div>
      ))}
      <div className="col-span-2 rounded-2xl border border-white/10 bg-gradient-to-br from-brand-500/20 to-transparent p-4 lg:col-span-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-brand-100">
          <IconCash size={16} /> Gross settled
        </div>
        <p className="mt-1 text-2xl font-bold text-white">{idr(s.grossPaid)}</p>
        <p className="text-xs text-slate-400">Pending volume: {idr(s.grossPending)}</p>
      </div>
    </div>
  );
}
