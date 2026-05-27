'use client';
import Image from 'next/image';
import Link from 'next/link';
import { cop } from '@/lib/format';
import { Product } from '@/lib/types';
import { useCart } from '@/providers/cart-provider';
export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  return <article className="product-card">
    <Link href={`/productos/${product.slug}`} className="product-image"><Image src={product.imageUrl} alt={product.name} width={340} height={300} /></Link>
    <div className="product-copy"><span className="tag">{product.category}</span><Link href={`/productos/${product.slug}`}><h3>{product.name}</h3></Link><p>{product.weightGrams} g · {product.description}</p><div className="product-bottom"><strong>{cop(product.price)}</strong><button onClick={() => add(product)} disabled={product.stock === 0}>{product.stock ? 'Agregar' : 'Agotado'}</button></div></div>
  </article>;
}
