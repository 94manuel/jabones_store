import { redirect } from 'next/navigation';
import { AdminPanel } from '@/components/admin-panel';
import { cop } from '@/lib/format';
import { serverApi, viewer } from '@/lib/server-api';
import { Order, Product, StoredFile } from '@/lib/types';

export const metadata = { title: 'Administración' };
export const dynamic = 'force-dynamic';

interface Summary { products: number; users: number; orders: number; pendingOrders: number; contacts: number; revenue: number; }
interface Contact { id: string; name: string; email: string; subject: string; createdAt: string; }

export default async function AdminPage() {
	const current = await viewer();
	if (!current) redirect('/login?next=/admin');
	if (current.role !== 'ADMIN') redirect('/cuenta');

	let data: [Summary, Product[], Order[], Contact[], StoredFile[]];
	try {
		data = await Promise.all([
			serverApi<Summary>('/admin/summary', {}, true),
			serverApi<Product[]>('/products/admin/all', {}, true),
			serverApi<Order[]>('/orders/admin/all', {}, true),
			serverApi<Contact[]>('/contact', {}, true),
			serverApi<StoredFile[]>('/files/admin?limit=20', {}, true),
		]);
	} catch {
		redirect('/cuenta');
	}

	const [summary, products, orders, contacts, files] = data;

	return (
		<div className="container admin-layout">
			<aside className="admin-nav">
				<h3>CocoEsencia Admin</h3>
				<a href="#dashboard">Dashboard</a>
				<a href="#archivos">Archivos</a>
				<a href="#productos">Productos</a>
				<a href="#pedidos">Pedidos</a>
				<a href="#contactos">Contactos</a>
				<a href="/">Ver tienda</a>
			</aside>
			<div>
				<div className="admin-title" id="dashboard">
					<div>
						<span className="eyebrow">Panel administrativo</span>
						<h1>Administración</h1>
					</div>
				</div>
				<div className="metric-grid">
					<div className="metric"><span>Productos</span><strong>{summary.products}</strong></div>
					<div className="metric"><span>Usuarios</span><strong>{summary.users}</strong></div>
					<div className="metric"><span>Pedidos</span><strong>{summary.orders}</strong></div>
					<div className="metric"><span>Por despachar</span><strong>{summary.pendingOrders}</strong></div>
					<div className="metric"><span>Ventas aprobadas</span><strong>{cop(summary.revenue)}</strong></div>
				</div>
				<AdminPanel initialProducts={products} initialOrders={orders} contacts={contacts} initialFiles={files} />
			</div>
		</div>
	);
}
