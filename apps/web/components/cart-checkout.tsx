'use client';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { cop } from '@/lib/format';
import { productImageSrc } from '@/lib/images';
import { useCart } from '@/providers/cart-provider';

export function CartCheckout() {
  const { items, subtotal, remove, update } = useCart();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const shipping = subtotal >= 100000 ? 0 : 12000;

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;
    setLoading(true);
    setError('');

    const address = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch('/api/backend/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        shippingAddress: address,
      }),
    });

    if (response.status === 401) {
      router.push('/login?next=/carrito');
      return;
    }

    const data = await response.json();
    if (!response.ok) {
      setError(Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'No fue posible crear el pedido.');
      setLoading(false);
      return;
    }

    router.push(`/pago?orderId=${data.id}`);
  }

  if (!items.length) {
    return (
      <div className="empty">
        <h2>Tu carrito está vacío</h2>
        <p>Selecciona un jabón artesanal para comenzar tu compra.</p>
        <button className="btn-primary" onClick={() => router.push('/tienda')}>Ir a la tienda</button>
      </div>
    );
  }

  return (
    <form className="cart-layout" onSubmit={checkout}>
      <div>
        <div className="cart-items">
          {items.map(({ product, quantity }) => (
            <article className="cart-item" key={product.id}>
              <img src={productImageSrc(product.imageUrl)} alt={product.name} width={90} height={90} />
              <div>
                <strong>{product.name}</strong>
                <div>{cop(product.price)}</div>
                <div className="qty">
                  <label>Cantidad</label>
                  <input type="number" min={1} max={product.stock} value={quantity} onChange={(event) => update(product.id, Number(event.target.value))} />
                  <button type="button" className="remove" onClick={() => remove(product.id)}>Eliminar</button>
                </div>
              </div>
              <strong>{cop(product.price * quantity)}</strong>
            </article>
          ))}
        </div>

        <div className="form-card" style={{ marginTop: 25 }}>
          <h2 style={{ fontFamily: 'Georgia,serif', marginTop: 0 }}>Dirección de entrega</h2>
          <div className="form-grid">
            <div className="field"><label>Nombre de quien recibe</label><input name="receiver" required /></div>
            <div className="field"><label>Teléfono</label><input name="phone" required /></div>
            <div className="field full"><label>Dirección</label><input name="line1" required /></div>
            <div className="field"><label>Ciudad</label><input name="city" required /></div>
            <div className="field"><label>Departamento</label><input name="region" required /></div>
            <input type="hidden" name="country" value="CO" />
          </div>
        </div>
      </div>

      <aside className="form-card summary">
        <h2 style={{ fontFamily: 'Georgia,serif', marginTop: 0 }}>Resumen</h2>
        {error && <p className="alert error">{error}</p>}
        <div className="line"><span>Subtotal</span><strong>{cop(subtotal)}</strong></div>
        <div className="line"><span>Envío</span><strong>{shipping ? cop(shipping) : 'Gratis'}</strong></div>
        <div className="line total"><span>Total</span><span>{cop(subtotal + shipping)}</span></div>
        <button className="btn-primary" style={{ width: '100%', marginTop: 18 }} disabled={loading}>{loading ? 'Creando pedido…' : 'Continuar al pago'}</button>
        <p className="details-copy" style={{ fontSize: '.83rem' }}>Pago protegido por Wompi. Tarjeta y PSE disponibles según la configuración del comercio.</p>
      </aside>
    </form>
  );
}
