import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function copyIfMissing(rel) {
  const src = path.join(root, rel + '.example');
  const dest = path.join(root, rel);
  if (!fs.existsSync(src)) return;
  if (fs.existsSync(dest)) {
    console.log(`• ${rel} already exists — skipped`);
    return;
  }
  fs.copyFileSync(src, dest);
  console.log(`✓ created ${rel}`);
}

copyIfMissing('backend/.env');
console.log('\nSetup complete. Edit backend/.env to add real Midtrans sandbox keys,');
console.log('or keep MIDTRANS_MOCK_MODE=true to explore without credentials.');
