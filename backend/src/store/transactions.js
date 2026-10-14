import { EventEmitter } from 'node:events';

/**
 * In-memory transaction store with a change event bus (drives the SSE stream).
 * Records are keyed by order_id.
 */
class TransactionStore extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(0);
    /** @type {Map<string, object>} */
    this.byOrderId = new Map();
  }

  upsert(orderId, patch) {
    const existing = this.byOrderId.get(orderId) || {
      order_id: orderId,
      created_at: new Date().toISOString(),
      timeline: [],
    };
    const next = { ...existing, ...patch, updated_at: new Date().toISOString() };
    if (patch.timelineEvent) {
      next.timeline = [
        ...(existing.timeline || []),
        { at: next.updated_at, ...patch.timelineEvent },
      ];
      delete next.timelineEvent;
    }
    this.byOrderId.set(orderId, next);
    this.emit('changed', { type: 'upsert', transaction: next });
    return next;
  }

  get(orderId) {
    return this.byOrderId.get(orderId) || null;
  }

  list() {
    return [...this.byOrderId.values()].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  }

  clear() {
    this.byOrderId.clear();
  }
}

export const transactionStore = new TransactionStore();
export default transactionStore;
