import express from 'express';

/**
 * Capture the raw request body for webhook routes so signatures can be
 * verified against the exact bytes Midtrans sent.
 */
export const rawBody = express.raw({ type: '*/*', limit: '1mb' });

export function parseJsonRaw(req, _res, next) {
  if (Buffer.isBuffer(req.body)) {
    const raw = req.body.toString('utf8');
    req.rawBody = raw;
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch {
      req.body = {};
    }
  }
  next();
}
