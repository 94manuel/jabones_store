import { LoginForm } from '@/components/login-form';
export const metadata = { title: 'Iniciar sesión' };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith('/') ? next : '/cuenta';
  return <div className="container"><div className="auth-wrap"><LoginForm nextPath={nextPath} /></div></div>;
}
