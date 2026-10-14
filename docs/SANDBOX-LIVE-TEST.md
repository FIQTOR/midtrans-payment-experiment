# Sandbox live test — results

Live test run against the real **Midtrans Sandbox** API, using a real sandbox
Server/Client key pair (kept locally in `backend/.env`, never committed).

## Configuration

```env
MIDTRANS_MOCK_MODE=false
MIDTRANS_SERVER_KEY=SB-Mid-server-****   # your sandbox server key
MIDTRANS_CLIENT_KEY=SB-Mid-client-****   # your sandbox client key
MIDTRANS_BASE_URL=https://api.sandbox.midtrans.com
MIDTRANS_SNAP_BASE_URL=https://app.sandbox.midtrans.com
```

## Results

| # | Test | Result |
| --- | --- | --- |
| 1 | `npm run midtrans:ping` (live) | ✅ reachable (server answered; auth accepted) |
| 2 | `POST /api/payments` Snap | ✅ real `token` + `redirect_url` returned |
| 3 | `POST /api/payments` Core **QRIS** | ✅ `transaction_id` + QR action URL (`201 Qris transaction is created`) |
| 4 | `POST /api/payments` Core **BCA VA** | ✅ real `va_number` returned (`201 Bank Transfer created`) |
| 5 | `GET /api/payments/:id/status` | ✅ live status synced from Midtrans |
| 6 | Basic Auth header | ✅ `base64("<serverKey>:")` accepted |
| 7 | Notification signature | ✅ `sha512(order+status+gross+key)` verifies, tampering rejected |

### Response shapes (values masked)

**Snap** — `POST /api/payments` `{amount:49000, channel:"qris", api_flavor:"snap"}`
```json
{
  "order_id": "ORDER-XXXXXXXXXX",
  "api_flavor": "snap",
  "token": "<snap-token-uuid>",
  "redirect_url": "https://app.sandbox.midtrans.com/snap/v4/redirection/<snap-token-uuid>",
  "internal_status": "PENDING"
}
```

**Core QRIS** — `transaction_status: pending`, `fraud_status: accept`, with
`actions[0].url = https://api.sandbox.midtrans.com/v2/qris/<id>/qr-code`.

**Core BCA VA** — `va_numbers[0] = { bank: "bca", va_number: "<masked>" }`.

## Notes / next steps

- **Webhook/notification needs a public URL.** The sandbox can only POST
  notifications to an internet-reachable HTTPS endpoint. For local testing,
  expose port `4011` with a tunnel and register the URL in the Midtrans
  dashboard:
  ```bash
  npx localtunnel --port 4011   # or: ngrok http 4011
  ```
  Then set **Settings → Configuration → Payment Notification URL** to
  `https://<tunnel>/api/webhooks/midtrans`.
- To **settle** a sandbox transaction, open the Snap `redirect_url` (or scan the
  QRIS) and complete the payment in the simulator — the notification will then
  flip the transaction to `PAID` on the dashboard.
- Real keys live only in `backend/.env` (gitignored). Rotate any key that has
  been shared in plaintext.
