export interface Product { id: string; slug: string; name: string; description: string; ingredients: string; category: string; price: number; stock: number; weightGrams: number; imageUrl: string; featured: boolean; active: boolean; }
export interface Viewer { sub: string; email: string; name: string; role: 'USER' | 'ADMIN'; }
export interface ShipmentEvent { id: string; status: string; title: string; description: string; location?: string; occurredAt: string; }
export interface Order { id: string; reference: string; trackingCode: string; subtotal: number; shippingCost: number; total: number; status: string; createdAt: string; items: Array<{ id: string; name: string; quantity: number; subtotal: number; unitPrice: number; }>; shipmentEvents: ShipmentEvent[]; payments?: Array<{ status: string; reference: string }> }
export interface StoredFile { key: string; fileName: string; size: number; contentType: string; lastModified: string; etag: string; publicUrl: string; }
