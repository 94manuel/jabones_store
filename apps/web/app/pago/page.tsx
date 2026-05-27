import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WompiCheckout } from '@/components/wompi-checkout';
import { cop } from '@/lib/format';
import { serverApi, viewer } from '@/lib/server-api';
import { Order } from '@/lib/types';
export const metadata = { title: 'Pago seguro' }; export const dynamic='force-dynamic';
export default async function PaymentPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) { const {orderId}=await searchParams; if(!(await viewer())) redirect('/login'); if(!orderId) redirect('/cuenta'); let order:Order; try{order=await serverApi<Order>(`/orders/mine/${orderId}`,{},true);}catch{redirect('/cuenta');}
 return <><section className="page-hero"><span className="eyebrow">Checkout seguro</span><h1>Finaliza tu pago</h1><p>Elige tarjeta o PSE dentro de la ventana protegida de Wompi.</p></section><section className="section"><div className="container pay-layout"><div className="form-card"><div className="order-head"><div><small>Pedido</small><h2 style={{fontFamily:'Georgia,serif',margin:'8px 0'}}>{order.reference}</h2><p>Código de rastreo: <strong>{order.trackingCode}</strong></p></div><strong className="price">{cop(order.total)}</strong></div><div className="payment-options"><span>💳 Tarjeta</span><span>🏦 PSE</span><span>🔐 Wompi</span></div>{order.status==='PENDING_PAYMENT' ? <WompiCheckout orderId={order.id}/> : <p className="alert">Este pedido ya registra estado: {order.status}.</p>}<p className="details-copy">La información financiera se ingresa directamente en Wompi. CocoEsencia recibe únicamente el resultado verificado del pago.</p><Link className="link-arrow" href="/cuenta">Volver a mi cuenta</Link></div></div></section></>;
}
