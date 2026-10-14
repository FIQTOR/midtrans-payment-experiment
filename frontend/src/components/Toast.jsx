import { useEffect } from 'react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const tone =
    toast.type === 'error'
      ? 'border-rose-500/40 bg-rose-500/15 text-rose-100'
      : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100';

  return (
    <div className="fixed bottom-5 right-5 z-[60]">
      <div className={`animate-fade-in rounded-xl border px-4 py-3 shadow-xl backdrop-blur ${tone}`}>
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
    </div>
  );
}
