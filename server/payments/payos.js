import { PayOS } from '@payos/node';

export function createPayOS(env = process.env) {
  return new PayOS({
    clientId: env.PAYOS_CLIENT_ID,
    apiKey: env.PAYOS_API_KEY,
    checksumKey: env.PAYOS_CHECKSUM_KEY,
    timeout: 15_000,
    maxRetries: 0,
  });
}
