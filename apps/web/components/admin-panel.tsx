'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cop, date, orderStatus } from '@/lib/format';
import { Order, Product, StoredFile } from '@/lib/types';

interface Contact { id: string; name: string; email: string; subject: string; createdAt: string; }

const statusOptions = ['PENDING_PAYMENT', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const defaultImageUrl = '/products/coco-puro.svg';

function formatBytes(size: number) {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
	if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
	return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export function AdminPanel({
	initialProducts,
	initialOrders,
	contacts,
	initialFiles,
}: {
	initialProducts: Product[];
	initialOrders: Order[];
	contacts: Contact[];
	initialFiles: StoredFile[];
}) {
	const router = useRouter();
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [products, setProducts] = useState(initialProducts);
	const [orders, setOrders] = useState(initialOrders);
	const [files, setFiles] = useState(initialFiles);
	const [imageUrl, setImageUrl] = useState(defaultImageUrl);
	const [uploading, setUploading] = useState(false);

	async function createProduct(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		setMessage('');

		const form = new FormData(event.currentTarget);
		const body = {
			...Object.fromEntries(form.entries()),
			imageUrl,
			price: Number(form.get('price')),
			stock: Number(form.get('stock')),
			weightGrams: Number(form.get('weightGrams')),
			featured: form.get('featured') === 'on',
			active: true,
		};

		const response = await fetch('/api/backend/products', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		const data = await response.json();

		if (response.ok) {
			setProducts((current) => [data, ...current]);
			setImageUrl(defaultImageUrl);
			setMessage('Producto agregado correctamente.');
			event.currentTarget.reset();
			router.refresh();
			return;
		}

		setError(Array.isArray(data.message) ? data.message.join(', ') : data.message);
	}

	async function uploadFile(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		setMessage('');

		const form = new FormData(event.currentTarget);
		const file = form.get('file');
		if (!(file instanceof File) || file.size === 0) {
			setError('Selecciona un archivo antes de subirlo.');
			return;
		}

		setUploading(true);
		const response = await fetch('/api/backend/files/upload', { method: 'POST', body: form });
		const data = await response.json();
		setUploading(false);

		if (response.ok) {
			setFiles((current) => [data, ...current.filter((item) => item.key !== data.key)].slice(0, 20));
			if (typeof data.contentType === 'string' && data.contentType.startsWith('image/')) {
				setImageUrl(data.publicUrl);
				setMessage('Archivo subido a MinIO. La URL de imagen ya quedo puesta en el formulario del producto.');
			} else {
				setMessage('Archivo subido a MinIO correctamente.');
			}
			event.currentTarget.reset();
			return;
		}

		setError(Array.isArray(data.message) ? data.message.join(', ') : data.message);
	}

	async function copyUrl(url: string) {
		try {
			await navigator.clipboard.writeText(url);
			setMessage('URL copiada al portapapeles.');
		} catch {
			setError('No fue posible copiar la URL.');
		}
	}

	function useAsProductImage(url: string) {
		setImageUrl(url);
		setMessage('La URL del archivo se asigno al campo de imagen del producto.');
		window.location.hash = '#productos';
	}

	async function deactivate(id: string) {
		if (!window.confirm('¿Desactivar este producto?')) return;
		const response = await fetch(`/api/backend/products/${id}`, { method: 'DELETE' });
		if (response.ok) {
			setProducts((current) => current.map((product) => (product.id === id ? { ...product, active: false } : product)));
			setMessage('Producto desactivado.');
			router.refresh();
		}
	}

	async function changeStatus(orderId: string, status: string) {
		const response = await fetch(`/api/backend/orders/admin/${orderId}/status`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status }),
		});
		if (response.ok) {
			const updated = await response.json();
			setOrders((current) =>
				current.map((order) =>
					order.id === orderId ? { ...order, status: updated.status, shipmentEvents: updated.shipmentEvents } : order,
				),
			);
			setMessage('Estado de pedido actualizado.');
			router.refresh();
		}
	}

	return (
		<>
			{message && <p className="alert">{message}</p>}
			{error && <p className="alert error">{error}</p>}

			<section id="archivos" className="table-card admin-form">
				<h2 className="table-title">Archivos en MinIO</h2>
				<form className="form-grid" style={{ padding: 22 }} onSubmit={uploadFile}>
					<div className="field">
						<label>Archivo</label>
						<input name="file" type="file" required />
					</div>
					<div className="field">
						<label>Carpeta opcional</label>
						<input name="folder" placeholder="productos, manuales, certificados" />
					</div>
					<div className="field" style={{ justifyContent: 'end' }}>
						<label>&nbsp;</label>
						<button className="btn-primary" disabled={uploading} type="submit">
							{uploading ? 'Subiendo...' : 'Subir archivo'}
						</button>
					</div>
					<div className="field full">
						<small style={{ color: 'var(--muted)' }}>
							Puedes subir cualquier tipo de archivo. El sistema lo guarda en MinIO y genera una URL pública para compartirlo con clientes.
						</small>
					</div>
				</form>
				<table>
					<thead>
						<tr>
							<th>Archivo</th>
							<th>Tipo</th>
							<th>Tamaño</th>
							<th>Fecha</th>
							<th>Acciones</th>
						</tr>
					</thead>
					<tbody>
						{files.length ? (
							files.map((file) => (
								<tr key={file.key}>
									<td>
										<strong>{file.fileName}</strong>
										<br />
										<small>{file.key}</small>
									</td>
									<td>{file.contentType}</td>
									<td>{formatBytes(file.size)}</td>
									<td>{date(file.lastModified)}</td>
									<td>
										<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
											<a className="table-btn" href={file.publicUrl} rel="noreferrer" target="_blank">Abrir</a>
											<button className="table-btn" onClick={() => copyUrl(file.publicUrl)} type="button">Copiar URL</button>
											{file.contentType.startsWith('image/') && (
												<button className="table-btn" onClick={() => useAsProductImage(file.publicUrl)} type="button">
													Usar en producto
												</button>
											)}
										</div>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={5}>Todavia no hay archivos almacenados en MinIO.</td>
							</tr>
						)}
					</tbody>
				</table>
			</section>

			<section id="productos">
				<div className="table-card admin-form">
					<h2 className="table-title">Agregar producto</h2>
					<form className="form-grid" style={{ padding: 22 }} onSubmit={createProduct}>
						<div className="field"><label>Nombre</label><input name="name" required /></div>
						<div className="field"><label>Slug</label><input name="slug" placeholder="coco-lavanda" required /></div>
						<div className="field"><label>Categoría</label><input name="category" required /></div>
						<div className="field">
							<label>Imagen</label>
							<input name="imageUrl" onChange={(event) => setImageUrl(event.target.value)} required value={imageUrl} />
							<small style={{ color: 'var(--muted)' }}>Puedes pegar una URL externa o reutilizar una imagen subida a MinIO.</small>
						</div>
						<div className="field"><label>Precio COP</label><input name="price" min="1" required type="number" /></div>
						<div className="field"><label>Inventario</label><input name="stock" min="0" required type="number" /></div>
						<div className="field"><label>Peso gramos</label><input name="weightGrams" min="1" required type="number" /></div>
						<div className="field"><label><input name="featured" type="checkbox" /> Producto destacado</label></div>
						<div className="field full"><label>Descripción</label><textarea name="description" required /></div>
						<div className="field full"><label>Ingredientes</label><textarea name="ingredients" required /></div>
						<button className="btn-primary">Guardar producto</button>
					</form>
				</div>
				<div className="table-card">
					<h2 className="table-title">Inventario de productos</h2>
					<table>
						<thead>
							<tr>
								<th>Producto</th>
								<th>Precio</th>
								<th>Stock</th>
								<th>Estado</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{products.map((product) => (
								<tr key={product.id}>
									<td><strong>{product.name}</strong><br /><small>{product.category}</small></td>
									<td>{cop(product.price)}</td>
									<td>{product.stock}</td>
									<td>{product.active ? 'Activo' : 'Inactivo'}</td>
									<td>{product.active && <button className="table-btn" onClick={() => deactivate(product.id)}>Desactivar</button>}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			<section className="table-card" id="pedidos">
				<h2 className="table-title">Gestión de pedidos</h2>
				<table>
					<thead>
						<tr>
							<th>Pedido / cliente</th>
							<th>Total</th>
							<th>Rastreo</th>
							<th>Estado</th>
							<th>Actualizar</th>
						</tr>
					</thead>
					<tbody>
						{orders.map((order) => (
							<tr key={order.id}>
								<td><strong>{order.reference}</strong><br /><small>{date(order.createdAt)}</small></td>
								<td>{cop(order.total)}</td>
								<td>{order.trackingCode}</td>
								<td>{orderStatus(order.status)}</td>
								<td>
									<select onChange={(event) => changeStatus(order.id, event.target.value)} value={order.status}>
										{statusOptions.map((status) => <option key={status} value={status}>{orderStatus(status)}</option>)}
									</select>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>

			<section className="table-card" id="contactos">
				<h2 className="table-title">Solicitudes de contacto</h2>
				<table>
					<thead>
						<tr>
							<th>Nombre</th>
							<th>Correo</th>
							<th>Asunto</th>
							<th>Fecha</th>
						</tr>
					</thead>
					<tbody>
						{contacts.length ? (
							contacts.map((contact) => (
								<tr key={contact.id}>
									<td>{contact.name}</td>
									<td>{contact.email}</td>
									<td>{contact.subject}</td>
									<td>{date(contact.createdAt)}</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={4}>No hay solicitudes nuevas.</td>
							</tr>
						)}
					</tbody>
				</table>
			</section>
		</>
	);
}
