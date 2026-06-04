import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddSingleProduct } from '@/components/add-single-product';
import { cop } from '@/lib/format';
import { productImageSrc } from '@/lib/images';
import { serverApi } from '@/lib/server-api';
import { Product } from '@/lib/types';
export const dynamic = 'force-dynamic';
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
 const { slug } = await params; let product: Product;
 try { product = await serverApi<Product>(`/products/${slug}`); } catch { notFound(); }
 return <section className="section"><div className="container details"><div className="details-image"><img src={productImageSrc(product.imageUrl)} alt={product.name} width={600} height={520} /></div><div><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><p className="details-copy">{product.description}</p><div className="price">{cop(product.price)}</div><p>{product.weightGrams} gramos · Inventario: {product.stock} unidades</p><div className="ingredients"><strong>Ingredientes</strong><p className="details-copy">{product.ingredients}</p></div><AddSingleProduct product={product} /><Link href="/tienda" className="link-arrow">← Regresar al catálogo</Link></div></div></section>;
}
