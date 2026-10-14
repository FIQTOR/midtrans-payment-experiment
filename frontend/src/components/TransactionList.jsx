import { IconSearch } from '@tabler/icons-react';
import StatusBadge from './StatusBadge.jsx';
import { idr } from '../lib/api.js';

export default function TransactionList({ items, onSelect, filter, onFilter }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
        <h2 className="mr-auto text-sm font-semibold text-white">Transactions</h2>
        <div className="relative">
          <IconSearch size={16} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            value={filter.q}
            onChange={(e) => onFilter({ ...filter, q: e.target.value })}
            placeholder="Search order id…"
            className="w-52 rounded-lg border border-white/10 bg-slate-900/60 py-2 pl-8 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <select
          value={filter.status}
          onChange={(e) => onFilter({ ...filter, status: e.target.value })}
          className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr className="border-b border-white/10">
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No transactions yet — create one to get started.
                </td>
              </tr>
            )}
            {items.map((t) => (
              <tr
                key={t.order_id}
                onClick={() => onSelect(t)}
                className="cursor-pointer border-b border-white/5 transition hover:bg-white/5"
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-200">{t.order_id}</td>
                <td className="px-4 py-3 text-slate-300">{t.payment_type || t.channel || '—'}</td>
                <td className="px-4 py-3 font-medium text-white">{idr(t.gross_amount)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={t.internal_status} />
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
