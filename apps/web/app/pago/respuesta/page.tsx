import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PaymentStatusMonitor } from '@/components/payment-status-monitor';
import { serverApi, viewer } from '@/lib/server-api';
export const metadata={title:'Resultado del pago'}; export const dynamic='force-dynamic';
interface PaymentInfo { orderId:string; orderStatus:string; payment:{status:string}|null; }
export default async function PaymentResultPage({searchParams}:{searchParams:Promise<{orderId?:string}>}) { const {orderId}=await searchParams; if(!(await viewer())) redirect('/login'); if(!orderId) redirect('/cuenta'); const info=await serverApi<PaymentInfo>(`/payments/order/${orderId}`,{},true).catch(()=>null); if(!info) redirect('/cuenta'); return <><section className="page-hero"><span className="eyebrow">Confirmación</span><h1>Estado de tu pago</h1><p>Validamos automáticamente la notificación de la pasarela para actualizar tu pedido.</p></section><section className="section"><div className="container pay-layout"><div className="form-card"><PaymentStatusMonitor initial={info} orderId={orderId}/><div className="button-row" style={{marginTop:25}}><Link className="btn-primary" href="/cuenta">Ver mis pedidos</Link><Link className="btn-secondary" href="/tienda">Seguir comprando</Link></div></div></div></section></>; }
