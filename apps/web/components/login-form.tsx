'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
export function LoginForm({ nextPath = '/cuenta' }: { nextPath?: string }) {
  const router = useRouter(); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(''); const form = new FormData(event.currentTarget); const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form.entries())) }); if (response.ok) { router.push(nextPath); router.refresh(); } else { const data = await response.json(); setError(data.message ?? 'No fue posible iniciar sesión.'); setLoading(false); } }
  return <form className="form-card" onSubmit={submit}><span className="eyebrow">Bienvenido</span><h1>Inicia sesión</h1><p className="details-copy">Accede para administrar tu cuenta, realizar pagos y consultar pedidos.</p>{error && <p className="alert error">{error}</p>}<div className="field" style={{ marginBottom: 15 }}><label>Correo electrónico</label><input type="email" name="email" required /></div><div className="field"><label>Contraseña</label><input type="password" name="password" minLength={8} required /></div><button className="btn-primary" style={{ width: '100%', marginTop: 24 }} disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar'}</button><p className="auth-foot">¿No tienes cuenta? <Link className="link-arrow" href="/registro">Regístrate</Link></p></form>;
}
