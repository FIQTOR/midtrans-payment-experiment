const STYLES = {
  PAID: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  PENDING: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  FAILED: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
  REFUNDED: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
};

export default function StatusBadge({ status }) {
  const cls = STYLES[status] || 'bg-slate-500/15 text-slate-300 ring-slate-500/30';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cls}`}>
      {status}
    </span>
  );
}
