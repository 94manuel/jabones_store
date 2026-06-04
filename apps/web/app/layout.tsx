import type { Metadata } from 'next';
import '@/app/globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ChatWidget } from '@/components/chat-widget';
import { VisitTracker } from '@/components/visit-tracker';
import { viewer } from '@/lib/server-api';
import { CartProvider } from '@/providers/cart-provider';

export const metadata: Metadata = {
  title: { default: 'CocoEsencia | Jabones artesanales', template: '%s | CocoEsencia' },
  description: 'Tienda virtual de jabones artesanales fabricados con aceite de coco. Compra segura y rastreo de pedidos.',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await viewer();
  return <html lang="es" data-scroll-behavior="smooth"><body><CartProvider><VisitTracker /><Header viewer={currentUser} /><main>{children}</main><Footer /><ChatWidget /></CartProvider></body></html>;
}
