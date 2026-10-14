import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../../certs');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.mkdirSync(certsDir, { recursive: true });
fs.writeFileSync(path.join(certsDir, 'private_key.pem'), privateKey);
fs.writeFileSync(path.join(certsDir, 'public_key.pem'), publicKey);

console.log('✅ RSA keypair written to backend/certs/ (private_key.pem, public_key.pem)');
console.log('   These files are gitignored — do not commit them.');
