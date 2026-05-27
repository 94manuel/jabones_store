import Image from 'next/image';
import Link from 'next/link';
export function Footer() { return <footer className="footer">
  <div><Image src="/logo-light.svg" alt="CocoEsencia" width={205} height={60} /><p>Jabones artesanales a base de coco, fabricados con cuidado y enviados a toda Colombia.</p></div>
  <div><h4>Comprar</h4><Link href="/tienda">Catálogo</Link><Link href="/carrito">Carrito</Link><Link href="/rastreo">Rastrear paquete</Link></div>
  <div><h4>Información</h4><Link href="/nosotros">Quiénes somos</Link><Link href="/contacto">Contacto</Link><span>Pagos por tarjeta y PSE</span></div>
  <div><h4>Atención</h4><span>Lunes a sábado</span><span>8:00 a.m. – 6:00 p.m.</span><span>Bogotá, Colombia</span></div>
  <div className="copyright">© {new Date().getFullYear()} CocoEsencia. Todos los derechos reservados.</div>
</footer>; }
