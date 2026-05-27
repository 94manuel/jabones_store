import { CartCheckout } from '@/components/cart-checkout';
export const metadata = { title: 'Carrito de compras' };
export default function CartPage() { return <><section className="page-hero"><span className="eyebrow">Compra</span><h1>Carrito de compras</h1><p>Confirma tus productos y registra la dirección para realizar el pago seguro.</p></section><section className="section"><div className="container"><CartCheckout /></div></section></>; }
