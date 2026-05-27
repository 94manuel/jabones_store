import Image from 'next/image';
import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { serverApi } from '@/lib/server-api';
import { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';
export default async function HomePage() {
  const products = await serverApi<Product[]>('/products?featured=true').catch(() => []);
  return <>
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow">100% naturales · Hechos a mano</span><h1>Pureza natural para <em>tu piel</em></h1><p>Jabones artesanales fabricados con aceite de coco, ingredientes seleccionados y procesos conscientes para transformar tu rutina diaria.</p><div className="button-row"><Link className="btn-primary" href="/tienda">Explorar productos</Link><Link className="btn-secondary" href="/nosotros">Nuestra historia →</Link></div></div>
      <div className="hero-visual"><div className="hero-photo"><Image src="/hero-soaps.svg" alt="Jabones artesanales CocoEsencia" width={760} height={700} priority /><div className="floating-card"><strong>+1.200</strong>Clientes felices</div></div></div>
    </section>
    <section className="benefits">
      <div className="benefit"><span className="benefit-icon">🌿</span><div><strong>100% Natural</strong><small>Ingredientes de origen natural</small></div></div>
      <div className="benefit"><span className="benefit-icon">🤲</span><div><strong>Hecho a mano</strong><small>Fabricación artesanal</small></div></div>
      <div className="benefit"><span className="benefit-icon">♻️</span><div><strong>Sostenible</strong><small>Empaque responsable</small></div></div>
      <div className="benefit"><span className="benefit-icon">📦</span><div><strong>Envíos nacionales</strong><small>Rastreo de tu paquete</small></div></div>
    </section>
    <section className="section"><div className="container"><div className="section-title"><div><span className="eyebrow">Nuestros productos</span><h2>Elige tu esencia</h2></div><Link href="/tienda" className="link-arrow">Ver todos los productos →</Link></div><div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></div></section>
    <section className="section alt"><div className="container split"><div className="story-card"><span className="eyebrow">CocoEsencia</span><h2>Fabricamos bienestar con propósito</h2><p>Nuestras fórmulas parten del aceite de coco y se elaboran en pequeños lotes. Priorizamos calidad, trazabilidad y una experiencia digital segura para comprar desde cualquier ciudad de Colombia.</p><div className="stats"><div><strong>4</strong><span>Fórmulas iniciales</span></div><div><strong>COP</strong><span>Pago seguro</span></div><div><strong>24/7</strong><span>Rastreo web</span></div></div></div><div className="payment-card"><h3>Compra con confianza</h3><p className="details-copy">Selecciona el medio de pago disponible desde nuestro checkout protegido. No almacenamos los datos de tu tarjeta ni tus credenciales bancarias.</p><div className="payment-list"><span>💳 Tarjeta</span><span>🏦 PSE</span><span>📲 Nequi</span><span>🔐 Pago seguro</span></div><Link className="btn-primary" href="/tienda">Comprar ahora</Link></div></div></section>
    <section className="banner"><div className="container banner-inner"><div><h2>¿Ya realizaste tu compra?</h2><p>Consulta el avance de tu pedido usando el código de rastreo.</p></div><Link className="btn-primary" href="/rastreo">Rastrear paquete</Link></div></section>
  </>;
}
