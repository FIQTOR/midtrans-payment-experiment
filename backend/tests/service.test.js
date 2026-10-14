import { describe, it, expect } from 'vitest';
import * as svc from '../src/services/midtransService.js';

describe('midtransService (mock mode)', () => {
  it('maps Midtrans statuses to internal states', () => {
    expect(svc.mapStatus('settlement')).toBe('PAID');
    expect(svc.mapStatus('capture', 'accept')).toBe('PAID');
    expect(svc.mapStatus('capture', 'challenge')).toBe('PENDING');
    expect(svc.mapStatus('pending')).toBe('PENDING');
    expect(svc.mapStatus('expire')).toBe('FAILED');
    expect(svc.mapStatus('refund')).toBe('REFUNDED');
    expect(svc.mapStatus('anything-else')).toBe('PENDING');
  });

  it('generates prefixed order ids', () => {
    expect(svc.newOrderId()).toMatch(/^ORDER-[A-Z0-9]+$/);
  });

  it('creates a snap transaction with token + redirect url in mock mode', async () => {
    const tx = await svc.createTransaction({ amount: 10000, channel: 'qris' });
    expect(tx.api_flavor).toBe('snap');
    expect(tx.token).toMatch(/^mock-snap-/);
    expect(tx.redirect_url).toContain('/redirection/');
  });

  it('creates a core QRIS transaction with a QR data url', async () => {
    const tx = await svc.createTransaction({ amount: 10000, channel: 'qris', force_core: true });
    expect(tx.api_flavor).toBe('core');
    expect(tx.qr_string).toBeTruthy();
    expect(tx.qr_data_url).toMatch(/^data:image\/png;base64,/);
  });

  it('creates a core bank transfer with a VA number', async () => {
    const tx = await svc.createTransaction({ amount: 50000, channel: 'bca', force_core: true });
    expect(tx.payment_type).toBe('bank_transfer');
    expect(tx.va_numbers[0].bank).toBe('bca');
  });

  it('ping succeeds in mock mode', async () => {
    const r = await svc.ping();
    expect(r.ok).toBe(true);
    expect(r.mock).toBe(true);
  });
});
