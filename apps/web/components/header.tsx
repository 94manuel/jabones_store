'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Viewer } from '@/lib/types';
import { useCart } from '@/providers/cart-provider';

export function Header({ viewer }: { viewer: Viewer | null }) {
  const { count } = useCart();
  const router = useRouter();
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); router.refresh(); }
  return <>
    <div className="announcement">Envío gratis por compras superiores a $100.000 COP · Fabricamos con aceite de coco</div>
    <header className="header">
      <Link className="brand" href="/"><Image src="/logo.svg" alt="CocoEsencia" width={230} height={68} priority /></Link>
      <nav className="nav" aria-label="Principal">
        <Link href="/">Inicio</Link><Link href="/tienda">Tienda</Link><Link href="/nosotros">Quiénes somos</Link><Link href="/contacto">Contacto</Link><Link href="/rastreo">Rastreo</Link>
      </nav>
      <div className="actions">
        {viewer?.role === 'ADMIN' && <Link className="admin-pill" href="/admin">Administrar</Link>}
        {viewer ? <><Link href="/cuenta" className="icon-link">Mi cuenta</Link><button className="text-btn" onClick={logout}>Salir</button></> : <Link href="/login" className="icon-link">Ingresar</Link>}
        <Link href="/carrito" className="cart">Carrito <span>{count}</span></Link>
      </div>
    </header>
  </>;
}
