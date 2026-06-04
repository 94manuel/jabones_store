'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cop, date, orderStatus } from '@/lib/format';
import { productImageSrc } from '@/lib/images';
import { Order, Product, SiteVisit, StoredFile } from '@/lib/types';

interface Contact { id: string; name: string; email: string; subject: string; createdAt: string; }

const statusOptions = ['PENDING_PAYMENT', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const defaultImageUrl = '/products/coco-puro.svg';

interface ProductFormState {
	name: string;
	slug: string;
	category: string;
	imageUrl: string;
	price: string;
	stock: string;
	weightGrams: string;
	description: string;
	ingredients: string;
	featured: boolean;
	active: boolean;
}

const emptyProductForm: ProductFormState = {
	name: '',
	slug: '',
	category: '',
	imageUrl: defaultImageUrl,
	price: '',
	stock: '',
	weightGrams: '',
	description: '',
	ingredients: '',
	featured: false,
	active: true,
};

function productToForm(product: Product): ProductFormState {
	return {
		name: product.name,
		slug: product.slug,
		category: product.category,
		imageUrl: productImageSrc(product.imageUrl),
		price: String(product.price),
		stock: String(product.stock),
		weightGrams: String(product.weightGrams),
		description: product.description,
		ingredients: product.ingredients,
		featured: product.featured,
		active: product.active,
	};
}

function formatVisitLocation(visit: SiteVisit) {
	return [visit.city, visit.region, visit.country].filter(Boolean).join(', ') || 'No disponible';
}

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
	visits,
}: {
	initialProducts: Product[];
	initialOrders: Order[];
	contacts: Contact[];
	initialFiles: StoredFile[];
	visits: SiteVisit[];
}) {
	const router = useRouter();
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [products, setProducts] = useState(initialProducts);
	const [orders, setOrders] = useState(initialOrders);
	const [files, setFiles] = useState(initialFiles);
	const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
	const [editingProductId, setEditingProductId] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);

	function updateProductField(field: keyof ProductFormState, value: string | boolean) {
		setProductForm((current) => ({ ...current, [field]: value }));
	}

	function resetProductForm() {
		setEditingProductId(null);
		setProductForm({ ...emptyProductForm });
	}

	function editProduct(product: Product) {
		setError('');
		setMessage('');
		setEditingProductId(product.id);
		setProductForm(productToForm(product));
		window.location.hash = '#productos';
	}

	async function saveProduct(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		setMessage('');

		const body = {
			name: productForm.name.trim(),
			slug: productForm.slug.trim(),
			category: productForm.category.trim(),
			imageUrl: productImageSrc(productForm.imageUrl),
			price: Number(productForm.price),
			stock: Number(productForm.stock),
			weightGrams: Number(productForm.weightGrams),
			description: productForm.description.trim(),
			ingredients: productForm.ingredients.trim(),
			featured: productForm.featured,
			active: productForm.active,
		};
		const editing = Boolean(editingProductId);

		const response = await fetch(editing ? `/api/backend/products/${editingProductId}` : '/api/backend/products', {
			method: editing ? 'PATCH' : 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		const data = await response.json().catch(() => null);

		if (response.ok) {
			setProducts((current) => editing ? current.map((product) => (product.id === data.id ? data : product)) : [data, ...current]);
			resetProductForm();
			setMessage(editing ? 'Producto actualizado correctamente.' : 'Producto agregado correctamente.');
			router.refresh();
			return;
		}

		setError(Array.isArray(data?.message) ? data.message.join(', ') : data?.message ?? 'No fue posible guardar el producto.');
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
				updateProductField('imageUrl', productImageSrc(data.publicUrl));
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
		updateProductField('imageUrl', productImageSrc(url));
		setMessage('La URL del archivo se asigno al campo de imagen del producto.');
		window.location.hash = '#productos';
	}

	async function setProductActive(id: string, active: boolean) {
		setError('');
		setMessage('');
		const response = await fetch(`/api/backend/products/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ active }),
		});
		const data = await response.json().catch(() => null);

		if (response.ok) {
			setProducts((current) => current.map((product) => (product.id === id ? data : product)));
			if (editingProductId === id) updateProductField('active', active);
			setMessage(active ? 'Producto activado.' : 'Producto desactivado.');
			router.refresh();
			return;
		}

		setError(Array.isArray(data?.message) ? data.message.join(', ') : data?.message ?? 'No fue posible actualizar el producto.');
	}

	async function deactivate(id: string) {
		if (!window.confirm('¿Desactivar este producto?')) return;
		await setProductActive(id, false);
	}

	async function activate(id: string) {
		await setProductActive(id, true);
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

			<section className="table-card" id="visitas">
				<h2 className="table-title">Visitas del sitio</h2>
				<table>
					<thead>
						<tr>
							<th>Fecha</th>
							<th>Página</th>
							<th>IP</th>
							<th>Ubicación</th>
							<th>Referencia</th>
						</tr>
					</thead>
					<tbody>
						{visits.length ? (
							visits.map((visit) => (
								<tr key={visit.id}>
									<td>{date(visit.createdAt)}</td>
									<td><strong>{visit.path}</strong></td>
									<td>
										<strong>{visit.ipAddress ?? 'No disponible'}</strong>
										{visit.userAgent && (
											<>
												<br />
												<small style={{ wordBreak: 'break-word' }}>{visit.userAgent}</small>
											</>
										)}
									</td>
									<td>{formatVisitLocation(visit)}</td>
									<td><small style={{ wordBreak: 'break-all' }}>{visit.referrer || 'Ingreso directo'}</small></td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={5}>Todavia no hay visitas registradas.</td>
							</tr>
						)}
					</tbody>
				</table>
			</section>

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
					<h2 className="table-title">{editingProductId ? 'Editar producto' : 'Agregar producto'}</h2>
					<form className="form-grid" style={{ padding: 22 }} onSubmit={saveProduct}>
						<div className="field"><label>Nombre</label><input name="name" onChange={(event) => updateProductField('name', event.target.value)} required value={productForm.name} /></div>
						<div className="field"><label>Slug</label><input name="slug" onChange={(event) => updateProductField('slug', event.target.value)} placeholder="coco-lavanda" required value={productForm.slug} /></div>
						<div className="field"><label>Categoría</label><input name="category" onChange={(event) => updateProductField('category', event.target.value)} required value={productForm.category} /></div>
						<div className="field">
							<label>Imagen</label>
							<input name="imageUrl" onChange={(event) => updateProductField('imageUrl', event.target.value)} required value={productForm.imageUrl} />
							<small style={{ color: 'var(--muted)' }}>Puedes pegar una URL externa o reutilizar una imagen subida a MinIO.</small>
						</div>
						<div className="field"><label>Precio COP</label><input name="price" min="1" onChange={(event) => updateProductField('price', event.target.value)} required type="number" value={productForm.price} /></div>
						<div className="field"><label>Inventario</label><input name="stock" min="0" onChange={(event) => updateProductField('stock', event.target.value)} required type="number" value={productForm.stock} /></div>
						<div className="field"><label>Peso gramos</label><input name="weightGrams" min="1" onChange={(event) => updateProductField('weightGrams', event.target.value)} required type="number" value={productForm.weightGrams} /></div>
						<div className="field"><label><input checked={productForm.featured} name="featured" onChange={(event) => updateProductField('featured', event.target.checked)} style={{ marginRight: 8, width: 'auto' }} type="checkbox" /> Producto destacado</label></div>
						<div className="field"><label><input checked={productForm.active} name="active" onChange={(event) => updateProductField('active', event.target.checked)} style={{ marginRight: 8, width: 'auto' }} type="checkbox" /> Producto activo</label></div>
						<div className="field full"><label>Descripción</label><textarea name="description" onChange={(event) => updateProductField('description', event.target.value)} required value={productForm.description} /></div>
						<div className="field full"><label>Ingredientes</label><textarea name="ingredients" onChange={(event) => updateProductField('ingredients', event.target.value)} required value={productForm.ingredients} /></div>
						<div className="button-row">
							<button className="btn-primary" type="submit">{editingProductId ? 'Actualizar producto' : 'Guardar producto'}</button>
							{editingProductId && <button className="btn-secondary" onClick={resetProductForm} type="button">Cancelar edición</button>}
						</div>
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
									<td>
										<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
											<button className="table-btn" onClick={() => editProduct(product)} type="button">Editar</button>
											{product.active ? (
												<button className="table-btn" onClick={() => deactivate(product.id)} type="button">Desactivar</button>
											) : (
												<button className="table-btn" onClick={() => activate(product.id)} type="button">Activar</button>
											)}
										</div>
									</td>
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
