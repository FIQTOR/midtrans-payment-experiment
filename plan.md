# 🧭 Midtrans Pay · Experiment Lab — Project Plan

> **Status:** ✅ **Implemented** — full-stack app running in mock mode (backend
> 22 tests passing, frontend builds clean).
>
> **Reference architecture:** [`doku-payment-experiment`](../doku-payment-experiment)
> (same monorepo shape, adapted to Midtrans' Snap / Core API surface & signing).
> **Docs:** <https://docs.midtrans.com/>

---

## 1. Goal

An **experimental full-stack playground** for the **Midtrans payment gateway** —
create payments (Snap Popup/Redirect + Core API charge), poll status, refund,
receive webhook notifications, and watch a live operator dashboard update in
real time.

Ships in **mock mode** by default, so the entire payment lifecycle can be
explored **without any credentials**.

---

## 2. Monorepo layout (target)

```
midtrans-payment-experiment/
├── backend/                 # Express.js REST API
│   ├── certs/               # RSA keys (SHA256withRSA / iris) — gitignored
│   ├── src/
│   │   ├── config/          # env parsing + validation (zod)
│   │   ├── controllers/     # payment / refund / webhook controllers
│   │   ├── db/              # Sequelize (in-memory | MySQL | SQLite)
│   │   ├── middlewares/     # error, rawBody, auth, rate-limit
│   │   ├── routes/          # /api/payments, /api/webhooks, ...
│   │   ├── services/        # midtransService (Snap + Core API client)
│   │   ├── store/           # in-memory transaction store
│   │   ├── utils/           # signature, qr, genKeyPair
│   │   ├── scripts/         # midtransPing (connection self-test)
│   │   └── server.js
│   ├── tests/               # Vitest + Supertest
│   └── tools/               # seed-demo.mjs
├── frontend/                # React 19 + Vite 8 + Tailwind v4
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/      # payment form, transaction list, modals, ...
│       ├── hooks/           # useTransactionEvents (SSE)
│       ├── lib/             # api client
│       ├── App.jsx
│       └── main.jsx
├── docs/                    # API mapping, sandbox setup, screenshots
├── scripts/                 # setup-env.mjs
├── .github/workflows/       # CI
├── docker-compose.yml
├── package.json             # root orchestration (concurrently)
└── plan.md                  # ← this file
```

---

## 3. Stack

| Layer | Choice |
| --- | --- |
| **Backend** | Node ≥ 20 · Express 4 · zod · helmet · express-rate-limit · morgan · axios · nanoid · Sequelize (mysql2 / sqlite3) |
| **Frontend** | React 19 · Vite 8 · TailwindCSS v4 · Tabler Icons · oxlint |
| **Tests** | Vitest + Supertest |
| **Infra** | Docker Compose (backend + frontend + MySQL) · GitHub Actions CI |
| **Orchestration** | root `package.json` with `concurrently` |

### Default ports (kept distinct from the DOKU experiment)

| Service | Port |
| --- | --- |
| Backend API | `4011` |
| Frontend dev | `5175` |
| Frontend (docker/nginx) | `8081` |
| MySQL | `3306` |

---

## 4. Midtrans API surface to integrate

### Disbursement-less core flows
1. **Snap** — `POST /snap/v1/transactions` → returns `token` + `redirect_url`;
   frontend uses **Snap.js** popup (`snap.pay(token)`).
2. **Core API charge** — `POST /v2/charge` with `payment_type`:
   - `qris` → returns QR string (render client-side) + `transaction_id`
   - `bank_transfer` → Virtual Account number (BCA / BNI / BRI / Permata)
   - `gopay` / `shopeepay` → deeplink / QR
   - `credit_card` → 3DS `redirect_url`
3. **Status** — `GET /v2/{order_id}/status`
4. **Cancel** — `POST /v2/{order_id}/cancel`
5. **Expire** — `POST /v2/{order_id}/expire`
6. **Refund** — `POST /v2/{order_id}/refund` (direct refund)
7. **Notifications** — Midtrans POSTs JSON to our webhook URL.

### Auth & signatures
- **HTTP Basic Auth**: `base64(MIDTRANS_SERVER_KEY + ":")` on every API call.
- **Notification signature**: `sha512(order_id + status_code + gross_amount + server_key)`
  compared against `signature_key` in the webhook body.
- **(Optional) Iris / SHA256withRSA** for the disbursement API, if added later.

### Notification fields of interest
`order_id`, `transaction_id`, `transaction_status`, `fraud_status`,
`payment_type`, `status_code`, `gross_amount`, `signature_key`.

Mapping of statuses → internal lifecycle (see §5).

---

## 5. Payment lifecycle (internal states)

```
PENDING ──► AUTHORIZED/PENDING ──► SETTLEMENT (paid)
   │                │                    │
   │                ├──► CAPTURE (card)  └──► REFUND / PARTIAL_REFUND
   ├──► EXPIRE
   └──► CANCEL / DENY / FAILURE
```

`transaction_status` → internal: `capture|settlement → PAID`,
`pending → PENDING`, `deny|cancel|expire|failure → FAILED`, `refund → REFUNDED`.

---

## 6. Backend plan

- [x] `src/config/index.js` — load + validate env (zod), expose typed config.
- [x] `src/utils/signature.js` — Basic Auth helper + `verifyNotificationSignature`.
- [x] `src/utils/qr.js` — render QR strings to data URLs (qrcode).
- [x] `src/utils/genKeyPair.js` — RSA keypair generator (future Iris/3DS use).
- [x] `src/services/midtransService.js` — axios client, Snap + Core API calls,
      mock mode branch, order-id generator.
- [x] `src/store/transactions.js` — in-memory store + event emitter (for SSE).
- [x] `src/db/*` — Sequelize models (Transaction, WebhookEvent) + sync/seed.
- [x] `src/controllers/*` — `paymentController`, `refundController`,
      `webhookController`.
- [x] `src/middlewares/*` — `rawBody` (signature verify), `error`, rate limit.
- [x] `src/routes/*` — mount `/api/payments`, `/api/refunds`, `/api/webhooks`,
      `/api/events` (SSE).
- [x] `src/scripts/midtransPing.js` — connection self-test (`npm run midtrans:ping`).
- [x] `tools/seed-demo.mjs` — seed sample transactions.

### REST endpoints (proposed)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | health probe |
| `POST` | `/api/payments` | create (Snap or Core) |
| `GET` | `/api/payments` | list + filters |
| `GET` | `/api/payments/:orderId` | detail |
| `GET` | `/api/payments/:orderId/status` | live status query |
| `POST` | `/api/payments/:orderId/cancel` | cancel |
| `POST` | `/api/payments/:orderId/expire` | expire |
| `POST` | `/api/payments/:orderId/refund` | refund |
| `POST` | `/api/payments/:orderId/simulate` | mock-mode state advance |
| `POST` | `/api/webhooks/midtrans` | notification receiver |
| `GET` | `/api/events` | SSE stream for live dashboard |

---

## 7. Frontend plan

- [x] `src/lib/api.js` — fetch wrapper for the backend REST API.
- [x] `src/hooks/useTransactionEvents.js` — subscribe to SSE `/api/events`.
- [x] Components:
  - [x] `Sidebar`, `StatsGrid`, `TransactionList`, `StatusBadge`
  - [x] `CreatePaymentForm` (Snap vs Core toggle + channel picker)
  - [x] `PaymentDetailModal` (QR / VA / deeplink / timeline / actions)
  - [x] `SnapPopupButton` (Snap.js embed)
  - [x] `WebhookTester` (copy endpoint + fire sample payloads)
  - [x] `Modal`, `Toast`
- [x] `App.jsx` — dashboard shell, tabs (Dashboard / Disbursement-free).
- [x] Tailwind v4 via `@tailwindcss/vite`; `index.css` with theme tokens.

---

## 8. Config & secrets

- Copy `backend/.env.example` → `backend/.env` (`npm run setup` does this).
- **Never** expose `MIDTRANS_SERVER_KEY` to the browser — only `CLIENT_KEY` is
  safe on the frontend (used by Snap.js).
- Mock mode (`MIDTRANS_MOCK_MODE=true`) needs **no credentials**.
- Real sandbox keys: <https://dashboard.sandbox.midtrans.com/>

---

## 9. Testing

- `backend/tests/` with Vitest + Supertest:
  - signature verification (valid / tampered)
  - service happy-path + mock mode
  - API routes (create / status / refund / webhook)
  - store + (optional) DB persistence
- Run: `npm test` (root) → `npm --prefix backend test`.

---

## 10. Milestones

| # | Milestone | Deliverable |
| --- | --- | --- |
| **M0** | ✅ Scaffold | folders + tooling config + `plan.md` (this) |
| **M1** | ✅ Backend core | config, service (mock), store, routes, webhook |
| **M2** | ✅ Frontend core | dashboard, create-payment, transaction list |
| **M3** | ✅ Lifecycle actions | status / cancel / expire / refund + detail modal |
| **M4** | ✅ Live updates | SSE events + webhook tester |
| **M5** | ✅ Persistence | Sequelize MySQL/SQLite + seed |
| **M6** | ✅ DX | Docker Compose, CI, `midtrans:ping`, docs |
| **M7** | ⏳ Real sandbox | wire real credentials, end-to-end test |

---

## 11. Next step — M7 (going live)

The app is fully working in **mock mode**. To go live against the Midtrans
sandbox:

1. `cp backend/.env.example backend/.env`
2. Set `MIDTRANS_MOCK_MODE=false` + real `SB-Mid-*` keys.
3. Expose port `4011` via a tunnel and register the notification URL
   (`/api/webhooks/midtrans`) in the Midtrans dashboard.
4. Verify with `npm run midtrans:ping`.

See [`docs/SANDBOX-SETUP.md`](docs/SANDBOX-SETUP.md).

---

## ⚠️ Disclaimer

Experimental, non-production sample code. Midtrans is a trademark of its
respective owner. Always follow Midtrans' PCI/security guidance for production.
