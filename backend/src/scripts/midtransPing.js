import config from '../config/index.js';
import { ping, newOrderId } from '../services/midtransService.js';

console.log('🔎 Midtrans connection self-test');
console.log(`   base URL : ${config.midtrans.baseUrl}`);
console.log(`   snap URL : ${config.midtrans.snapBaseUrl}`);
console.log(`   mock mode: ${config.mockMode}`);
console.log(`   sample id: ${newOrderId()}\n`);

const result = await ping();
console.log(result);
process.exit(result.ok ? 0 : 1);
