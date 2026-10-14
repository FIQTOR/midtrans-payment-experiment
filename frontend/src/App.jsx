import { useCallback, useEffect, useState } from 'react';
import { IconRefresh } from '@tabler/icons-react';

import Sidebar from './components/Sidebar.jsx';
import StatsGrid from './components/StatsGrid.jsx';
import TransactionList from './components/TransactionList.jsx';
import CreatePaymentForm from './components/CreatePaymentForm.jsx';
import PaymentDetailModal from './components/PaymentDetailModal.jsx';
import WebhookTester from './components/WebhookTester.jsx';
import Toast from './components/Toast.jsx';

import { api } from './lib/api.js';
import { useTransactionEvents } from './hooks/useTransactionEvents.js';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [health, setHealth] = useState(null);
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState({ q: '', status: '' });
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((t) => setToast(t), []);

  const refresh = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([api.stats(), api.listPayments(filter)]);
      setStats(s);
      setItems(l.items);
    } catch (err) {
      notify({ type: 'error', message: err.message });
    }
  }, [filter, notify]);

  // initial load
  useEffect(() => {
    (async () => {
      try {
        const [h, c] = await Promise.all([api.health(), api.getConfig()]);
        setHealth(h);
        setConfig(c);
      } catch {
        setHealth({ ok: false });
      }
    })();
  }, []);

  // reload on filter changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  // live updates via SSE
  useTransactionEvents(
    useCallback(
      (evt) => {
        setItems((prev) => {
          const rest = prev.filter((t) => t.order_id !== evt.transaction.order_id);
          return [evt.transaction, ...rest];
        });
        setSelected((cur) => (cur && cur.order_id === evt.transaction.order_id ? evt.transaction : cur));
        api.stats().then(setStats).catch(() => {});
      },
      [],
    ),
  );

  const createPayment = async (payload) => {
    setBusy(true);
    try {
      const tx = await api.createPayment(payload);
      notify({ type: 'success', message: `Created ${tx.order_id}` });
      setSelected(tx);
      setTab('dashboard');
      refresh();
    } catch (err) {
      notify({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const onChanged = (updated) => {
    setItems((prev) => prev.map((t) => (t.order_id === updated.order_id ? updated : t)));
    setSelected(updated);
    api.stats().then(setStats).catch(() => {});
  };

  return (
    <div className="flex h-full">
      <Sidebar tab={tab} onTab={setTab} health={health} />

      <main className="flex-1 overflow-y-auto p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {tab === 'dashboard' ? 'Dashboard' : tab === 'create' ? 'Create payment' : 'Webhook tester'}
            </h1>
            <p className="text-sm text-slate-400">
              {health?.mockMode ? 'Running in mock mode — no live credentials required.' : 'Live mode.'}
            </p>
          </div>
          <button
            onClick={refresh}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
          >
            <IconRefresh size={16} /> Refresh
          </button>
        </header>

        {tab === 'dashboard' && (
          <div className="space-y-6">
            <StatsGrid stats={stats} />
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <TransactionList items={items} onSelect={setSelected} filter={filter} onFilter={setFilter} />
              <CreatePaymentForm onCreate={createPayment} busy={busy} />
            </div>
          </div>
        )}

        {tab === 'create' && (
          <div className="max-w-xl">
            <CreatePaymentForm onCreate={createPayment} busy={busy} />
          </div>
        )}

        {tab === 'webhooks' && (
          <div className="max-w-2xl">
            <WebhookTester config={config} onToast={notify} />
          </div>
        )}
      </main>

      <PaymentDetailModal
        tx={selected}
        onClose={() => setSelected(null)}
        onChanged={onChanged}
        onToast={notify}
        mockMode={health?.mockMode}
        clientKey={config?.clientKey}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
