import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource, In, Repository } from 'typeorm';
import { OrderEntity, OrderItemEntity, ProductEntity, ShipmentEventEntity } from '../../database/entities';
import { OrderStatus } from '../../database/enums';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    @InjectRepository(ShipmentEventEntity) private readonly events: Repository<ShipmentEventEntity>,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    return this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(ProductEntity);
      const orderRepo = manager.getRepository(OrderEntity);
      const itemRepo = manager.getRepository(OrderItemEntity);
      const eventRepo = manager.getRepository(ShipmentEventEntity);
      const ids = dto.items.map((item) => item.productId);
      const products = await productRepo.find({ where: { id: In(ids), active: true } });
      if (products.length !== new Set(ids).size) throw new BadRequestException('Uno o más productos no están disponibles.');
      const orderItems = dto.items.map((item) => {
        const product = products.find((entry) => entry.id === item.productId)!;
        if (item.quantity > product.stock) throw new BadRequestException(`Inventario insuficiente para ${product.name}.`);
        return { productId: product.id, name: product.name, unitPrice: product.price, quantity: item.quantity, subtotal: product.price * item.quantity };
      });
      const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      const order = await orderRepo.save(orderRepo.create({
        userId, reference: `JA-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`, trackingCode: `COCO-${randomBytes(5).toString('hex').toUpperCase()}`,
        subtotal, shippingCost: subtotal >= 100000 ? 0 : 12000, total: subtotal + (subtotal >= 100000 ? 0 : 12000), status: OrderStatus.PENDING_PAYMENT, addressSnapshot: dto.shippingAddress as unknown as Record<string, string>,
      }));
      order.items = await itemRepo.save(orderItems.map((item) => itemRepo.create({ ...item, orderId: order.id })));
      order.shipmentEvents = [await eventRepo.save(eventRepo.create({ orderId: order.id, status: OrderStatus.PENDING_PAYMENT, title: 'Pedido registrado', description: 'El pedido fue creado y está pendiente del pago.' }))];
      for (const item of orderItems) {
        const product = products.find((entry) => entry.id === item.productId)!;
        product.stock -= item.quantity;
        await productRepo.save(product);
      }
      return order;
    });
  }

  async mine(userId: string) { return this.sortEvents(await this.orders.find({ where: { userId }, relations: { items: true, payments: true, shipmentEvents: true }, order: { createdAt: 'DESC' } })); }
  async oneForUser(id: string, userId: string) {
    const order = await this.orders.findOne({ where: { id }, relations: { items: true, payments: true, shipmentEvents: true } });
    if (!order) throw new NotFoundException('Pedido no encontrado.');
    if (order.userId !== userId) throw new ForbiddenException('No puede consultar este pedido.');
    this.sortEventList(order);
    return order;
  }
  async tracking(code: string) {
    const order = await this.orders.findOne({ where: { trackingCode: code }, relations: { shipmentEvents: true } });
    if (!order) throw new NotFoundException('Código de rastreo no encontrado.');
    this.sortEventList(order);
    return { trackingCode: order.trackingCode, status: order.status, createdAt: order.createdAt, shipmentEvents: order.shipmentEvents };
  }
  async adminList() { return this.sortEvents(await this.orders.find({ relations: { user: true, items: true, payments: true, shipmentEvents: true }, order: { createdAt: 'DESC' } })); }
  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Pedido no encontrado.');
    order.status = dto.status;
    await this.orders.save(order);
    await this.events.save(this.events.create({ orderId: order.id, status: dto.status, title: this.title(dto.status), description: dto.description ?? this.description(dto.status), location: dto.location }));
    return this.orders.findOne({ where: { id }, relations: { shipmentEvents: true } });
  }
  private sortEvents(orders: OrderEntity[]) { orders.forEach((order) => this.sortEventList(order)); return orders; }
  private sortEventList(order: OrderEntity) { order.shipmentEvents?.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()); }
  private title(status: OrderStatus) { return ({ PENDING_PAYMENT: 'Pago pendiente', PAID: 'Pago confirmado', PREPARING: 'Preparando pedido', SHIPPED: 'Pedido enviado', DELIVERED: 'Pedido entregado', CANCELLED: 'Pedido cancelado' } as Record<OrderStatus, string>)[status]; }
  private description(status: OrderStatus) { return ({ PENDING_PAYMENT: 'Aguardando confirmación de pago.', PAID: 'El pago fue aprobado.', PREPARING: 'Estamos fabricando y empacando su pedido.', SHIPPED: 'El paquete fue entregado a la transportadora.', DELIVERED: 'El paquete fue recibido.', CANCELLED: 'El pedido fue cancelado.' } as Record<OrderStatus, string>)[status]; }
}
