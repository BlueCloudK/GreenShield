import { paymentConfig } from '../server/payments/service.js';

const keys = ['PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY'];
const configured = Object.fromEntries(keys.map(key => [key, Boolean(process.env[key]?.trim())]));
console.log(JSON.stringify({
  keys: configured,
  enabled: process.env.PAYOS_ENABLED === 'true',
  samplePriceVnd: Number(process.env.PAYOS_ASSESSMENT_AMOUNT_VND) || null,
  smtpConfigured: Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()),
  externalRequestsMade: false,
}, null, 2));
try { paymentConfig(); }
catch (error) { console.error(error.message); process.exitCode = 1; }
if (Object.values(configured).some(value => !value)) process.exitCode = 1;
