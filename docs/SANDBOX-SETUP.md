# Going live with the Midtrans sandbox

From mock mode to a real Midtrans sandbox integration.

## 1. Prerequisites

- A Midtrans account: <https://dashboard.sandbox.midtrans.com/>
- Node.js ≥ 20 (or Docker).

## 2. Get sandbox credentials

1. Log in to the Midtrans dashboard (ensure the environment toggle is **Sandbox**).
2. Go to **Settings → Access Keys**.
3. Copy:
   - **Server Key** (`SB-Mid-server-…`) — secret, backend only.
   - **Client Key** (`SB-Mid-client-…`) — public, used by Snap.js.

## 3. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Set at minimum:

```env
MIDTRANS_MOCK_MODE=false
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxxxxxx
MIDTRANS_BASE_URL=https://api.sandbox.midtrans.com
MIDTRANS_SNAP_BASE_URL=https://app.sandbox.midtrans.com
PUBLIC_BASE_URL=https://your-tunnel.example.com
```

## 4. Webhook / notification URL

Midtrans must be able to reach your backend over the public internet.
For local development, expose port `4011` with a tunnel:

```bash
npx localtunnel --port 4011        # or: ngrok http 4011
```

Then, in the Midtrans dashboard → **Settings → Configuration → Payment Notification URL**, set:

```
https://your-tunnel.example.com/api/webhooks/midtrans
```

The frontend's **Webhook tester** tab shows the exact endpoint this backend expects.

## 5. Run

```bash
npm run dev          # backend :4011 + frontend :5175
```

## 6. Verify

- **Dashboard → Connection self-test:**
  ```bash
  npm run midtrans:ping
  ```
- Create a payment in the UI; in live mode it calls the real sandbox.
- After paying, Midtrans posts a notification → it appears live on the dashboard.

## Switching environments

| | Sandbox | Production |
| --- | --- | --- |
| API | `https://api.sandbox.midtrans.com` | `https://api.midtrans.com` |
| Snap | `https://app.sandbox.midtrans.com` | `https://app.midtrans.com` |
| Keys | `SB-Mid-…` | live keys |

> ⚠️ Production notifications require an **HTTPS** URL.
