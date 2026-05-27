import { createHash } from 'crypto';

export function createCheckoutSignature(reference: string, amountInCents: number, currency: string, integritySecret: string, expirationTime?: string): string {
  const value = `${reference}${amountInCents}${currency}${expirationTime ?? ''}${integritySecret}`;
  return createHash('sha256').update(value).digest('hex');
}

function valueByPath(data: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (typeof value !== 'object' || value === null) return undefined;
    return (value as Record<string, unknown>)[key];
  }, data);
}

export function createEventChecksum(data: unknown, properties: string[], timestamp: number, eventsSecret: string): string {
  const values = properties.map((property) => String(valueByPath(data, property) ?? '')).join('');
  return createHash('sha256').update(`${values}${timestamp}${eventsSecret}`).digest('hex').toUpperCase();
}
