import { TrackingForm } from '@/components/tracking-form';
export const metadata = { title: 'Rastrear pedido' };
export default async function TrackingPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) { const { code } = await searchParams; return <><section className="page-hero"><span className="eyebrow">Seguimiento</span><h1>Rastrea tu paquete</h1><p>Ingresa el código enviado al confirmar tu pedido para consultar cada avance de entrega.</p></section><section className="section"><div className="container"><TrackingForm initialCode={code ?? ''} /></div></section></>; }
