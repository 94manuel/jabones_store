import { ProductCard } from '@/components/product-card';
import { serverApi } from '@/lib/server-api';
import { Product } from '@/lib/types';
export const metadata = { title: 'Tienda' }; export const dynamic = 'force-dynamic';
export default async function ShopPage() {
 const products = await serverApi<Product[]>('/products').catch(() => []);
 return <><section className="page-hero"><span className="eyebrow">Catálogo</span><h1>Jabones CocoEsencia</h1><p>Explora nuestras barras naturales y jabones líquidos artesanales fabricados con aceite de coco.</p></section><section className="section"><div className="container"><div className="shop-toolbar"><strong>{products.length} productos disponibles</strong><span>Envío gratis desde $100.000</span></div><div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></div></section></>;
}
