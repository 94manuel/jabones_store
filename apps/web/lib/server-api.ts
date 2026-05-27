import { cookies } from 'next/headers';
import { Viewer } from './types';

const apiUrl = () => process.env.API_INTERNAL_URL ?? 'http://localhost:4000/api/v1';

export async function serverApi<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
  const token = authenticated ? (await cookies()).get('ja_token')?.value : undefined;
  const response = await fetch(`${apiUrl()}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`${response.status}`);
  return response.json() as Promise<T>;
}
export async function viewer(): Promise<Viewer | null> {
  try { return await serverApi<Viewer>('/auth/me', {}, true); } catch { return null; }
}
