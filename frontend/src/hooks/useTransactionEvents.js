import { useEffect, useRef } from 'react';

/**
 * Subscribe to the backend SSE stream. Calls onEvent(payload) on every
 * `transaction` message. Falls back silently if EventSource is unavailable.
 */
export function useTransactionEvents(onEvent) {
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (typeof EventSource === 'undefined') return;
    const es = new EventSource('/api/payments/events');
    es.addEventListener('transaction', (e) => {
      try {
        handler.current?.(JSON.parse(e.data));
      } catch {
        /* ignore malformed frames */
      }
    });
    es.onerror = () => {
      /* browser auto-reconnects */
    };
    return () => es.close();
  }, []);
}

export default useTransactionEvents;
