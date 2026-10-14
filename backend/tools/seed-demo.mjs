/**
 * Seeds a handful of demo transactions through the running backend.
 * Usage: node tools/seed-demo.mjs [baseUrl]
 */
const base = process.argv[2] || process.env.SEED_BASE_URL || 'http://localhost:4011';

const samples = [
  { amount: 49000, channel: 'qris' },
  { amount: 125000, channel: 'bca' },
  { amount: 250000, channel: 'gopay' },
  { amount: 999000, channel: 'credit_card' },
  { amount: 75000, channel: 'bni' },
];

async function post(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

const created = [];
for (const s of samples) {
  const tx = await post('/api/payments', s);
  created.push(tx);
  console.log(`  ✅ ${tx.order_id}  ${s.channel.padEnd(12)} Rp${s.amount.toLocaleString('id-ID')}`);
}

// Make a couple of them settle/refund for a livelier dashboard.
if (created[0]) await post(`/api/payments/${created[0].order_id}/simulate?status=PAID`);
if (created[1]) await post(`/api/payments/${created[1].order_id}/simulate?status=PAID`);
if (created[2]) await post(`/api/payments/${created[2].order_id}/simulate?status=FAILED`);
if (created[0]) await post(`/api/payments/${created[0].order_id}/refund`, { reason: 'demo refund' });

console.log(`\n🌱 Seeded ${created.length} transactions at ${base}`);
