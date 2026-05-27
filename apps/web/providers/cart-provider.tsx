'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Product } from '@/lib/types';

export interface CartItem { product: Product; quantity: number; }
interface CartContextValue { items: CartItem[]; count: number; subtotal: number; add: (product: Product) => void; remove: (id: string) => void; update: (id: string, quantity: number) => void; clear: () => void; }
const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => { const stored = localStorage.getItem('cocoesencia_cart'); if (stored) setItems(JSON.parse(stored)); setReady(true); }, []);
  useEffect(() => { if (ready) localStorage.setItem('cocoesencia_cart', JSON.stringify(items)); }, [items, ready]);
  const value = useMemo(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    add: (product: Product) => setItems((current) => { const found = current.find((item) => item.product.id === product.id); return found ? current.map((item) => item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item) : [...current, { product, quantity: 1 }]; }),
    remove: (id: string) => setItems((current) => current.filter((item) => item.product.id !== id)),
    update: (id: string, quantity: number) => setItems((current) => current.map((item) => item.product.id === id ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stock)) } : item)),
    clear: () => setItems([]),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const context = useContext(CartContext); if (!context) throw new Error('useCart debe utilizarse dentro de CartProvider'); return context; }
