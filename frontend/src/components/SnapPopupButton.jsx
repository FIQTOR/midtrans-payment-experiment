import { useEffect, useState } from 'react';

const SNAP_SCRIPT = 'https://app.sandbox.midtrans.com/snap/snap.js';

/**
 * Embeds Snap.js and opens the popup for a given snap token.
 * In mock mode there is no real token, so the button is disabled with a hint.
 */
export default function SnapPopupButton({ token, clientKey, mock, redirectUrl }) {
  const [loaded, setLoaded] = useState(typeof window !== 'undefined' && !!window.snap);

  useEffect(() => {
    if (loaded || !clientKey || mock) return;
    const s = document.createElement('script');
    s.src = SNAP_SCRIPT;
    s.setAttribute('data-client-key', clientKey);
    s.onload = () => setLoaded(true);
    document.body.appendChild(s);
    return () => s.remove();
  }, [loaded, clientKey, mock]);

  const pay = () => {
    if (window.snap && token) {
      window.snap.pay(token, {
        onSuccess: () => window.location.reload(),
        onPending: () => window.location.reload(),
        onError: () => window.location.reload(),
      });
    } else if (redirectUrl) {
      window.open(redirectUrl, '_blank');
    }
  };

  return (
    <button
      onClick={pay}
      disabled={!redirectUrl && (!loaded || mock)}
      className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-500 disabled:opacity-50"
      title={mock ? 'Mock token — use the redirect URL' : 'Open Snap popup'}
    >
      {mock ? 'Open mock checkout' : 'Pay with Snap'}
    </button>
  );
}
