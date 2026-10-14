# Midtrans API mapping

How this experiment maps onto Midtrans' real API surface.

## Endpoints used

| Our route | Midtrans call | Notes |
| --- | --- | --- |
| `POST /api/payments` (flavor=snap) | `POST {snap}/snap/v1/transactions` | returns `token` + `redirect_url` |
| `POST /api/payments` (flavor=core) | `POST {api}/v2/charge` | `payment_type`: qris / bank_transfer / gopay / shopeepay / credit_card |
| `GET /api/payments/:id/status` | `GET {api}/v2/{order_id}/status` | live status query |
| `POST /api/payments/:id/cancel` | `POST {api}/v2/{order_id}/cancel` | |
| `POST /api/payments/:id/expire` | `POST {api}/v2/{order_id}/expire` | |
| `POST /api/payments/:id/refund` | `POST {api}/v2/{order_id}/refund` | optional `refund_amount` |
| `POST /api/webhooks/midtrans` | *inbound* notification | we are the receiver |

Base URLs:
- API: `https://api.sandbox.midtrans.com` (Sandbox) / `https://api.midtrans.com` (Prod)
- Snap: `https://app.sandbox.midtrans.com` / `https://app.midtrans.com`

## Auth

HTTP Basic with the Server Key as username, empty password:

```
Authorization: Basic base64("<SERVER_KEY>:")
```

The Client Key is public and only used by Snap.js in the browser.

## Notification signature

```
signature_key = sha512(order_id + status_code + gross_amount + server_key)
```

Implemented in `backend/src/utils/signature.js` → `verifyNotificationSignature`.

## Status mapping (Midtrans → internal)

| transaction_status | fraud_status | internal |
| --- | --- | --- |
| `capture` | `accept` | `PAID` |
| `capture` | `challenge` | `PENDING` |
| `settlement` | — | `PAID` |
| `pending` | — | `PENDING` |
| `deny` / `cancel` / `expire` / `failure` | — | `FAILED` |
| `refund` / `partial_refund` | — | `REFUNDED` |

Implemented in `backend/src/services/midtransService.js` → `mapStatus`.

## Requests

### Snap
```bash
curl -X POST http://localhost:4011/api/payments \
  -H 'Content-Type: application/json' \
  -d '{"amount":49000,"channel":"qris","api_flavor":"snap"}'
```

### Core QRIS
```bash
curl -X POST http://localhost:4011/api/payments \
  -H 'Content-Type: application/json' \
  -d '{"amount":49000,"channel":"qris","api_flavor":"core"}'
```

### Simulate (mock mode only)
```bash
curl -X POST 'http://localhost:4011/api/payments/<order_id>/simulate?status=PAID'
```
