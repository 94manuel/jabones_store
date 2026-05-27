import { NextRequest, NextResponse } from 'next/server';
const api = process.env.API_INTERNAL_URL ?? 'http://localhost:4000/api/v1';
export async function POST(request: NextRequest) {
  const body = await request.json();
  const response = await fetch(`${api}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  const output = NextResponse.json(data, { status: response.status });
  if (response.ok) output.cookies.set('ja_token', data.accessToken, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 86400 });
  return output;
}
