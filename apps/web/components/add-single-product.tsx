'use client';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { useCart } from '@/providers/cart-provider';
export function AddSingleProduct({ product }: { product: Product }) { const { add } = useCart(); const router = useRouter(); return <div className="button-row" style={{ marginBottom: 26 }}><button className="btn-primary" onClick={() => { add(product); router.push('/carrito'); }} disabled={!product.stock}>Agregar al carrito</button></div>; }
