import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const api = process.env.API_INTERNAL_URL ?? 'http://localhost:4000/api/v1';

const hopByHopHeaders = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);

function filteredHeaders(headers: Headers) {
  const output = new Headers();
  headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      output.set(key, value);
    }
  });
  return output;
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const token = (await cookies()).get('ja_token')?.value;
  const target = `${api}/${path.join('/')}${request.nextUrl.search}`;
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const headers = filteredHeaders(new Headers(request.headers));

  headers.delete('host');
  headers.delete('content-length');
  if (token) headers.set('authorization', `Bearer ${token}`);

  const response = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? Buffer.from(await request.arrayBuffer()) : undefined,
    cache: 'no-store',
  });

  return new NextResponse(response.body, { status: response.status, headers: filteredHeaders(response.headers) });
}
export const GET = proxy; export const POST = proxy; export const PATCH = proxy; export const DELETE = proxy;
