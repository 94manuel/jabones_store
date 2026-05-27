import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { OrderEntity, PaymentEntity, ShipmentEventEntity } from '../../database/entities';
import { OrderStatus, PaymentStatus } from '../../database/enums';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { createCheckoutSignature, createEventChecksum } from './utils/wompi-signature';

interface WompiEvent {
  event: string;
  data: { transaction?: { id: string; reference: string; status: string; amount_in_cents: number; currency: string } };
  signature: { properties: string[]; checksum: string };
  timestamp: number;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
    private readonly config: ConfigService,
  ) {}

  async checkout(userId: string, dto: CreateCheckoutDto) {
    const order = await this.orders.findOne({ where: { id: dto.orderId }, relations: { user: true } });
    if (!order) throw new NotFoundException('Pedido no encontrado.');
    if (order.userId !== userId) throw new ForbiddenException('No puede pagar este pedido.');
    if (order.status !== OrderStatus.PENDING_PAYMENT) throw new BadRequestException('El pedido no está pendiente de pago.');
    const publicKey = this.config.get<string>('WOMPI_PUBLIC_KEY');
    const integritySecret = this.config.get<string>('WOMPI_INTEGRITY_SECRET');
    if (!publicKey || !integritySecret || publicKey.includes('REEMPLAZAR') || integritySecret.includes('REEMPLAZAR')) {
      throw new BadRequestException('Configure las credenciales sandbox o producción de Wompi en el backend.');
    }
    const reference = `PAY-${order.reference}-${randomBytes(3).toString('hex').toUpperCase()}`;
    const amountInCents = order.total * 100;
    const currency = 'COP';
    const expirationTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const integrity = createCheckoutSignature(reference, amountInCents, currency, integritySecret, expirationTime);
    await this.payments.save(this.payments.create({ orderId: order.id, reference, amountInCents, currency, status: PaymentStatus.PENDING }));
    const redirectUrl = `${this.config.get<string>('FRONTEND_URL', 'http://localhost:3000')}/pago/respuesta?orderId=${order.id}`;
    const address = order.addressSnapshot;
    return {
      orderId: order.id, publicKey, currency, amountInCents, reference, expirationTime, redirectUrl, signature: { integrity },
      customerData: { email: order.user.email, fullName: order.user.name, phoneNumber: order.user.phone ?? undefined, phoneNumberPrefix: '+57' },
      shippingAddress: { addressLine1: address.line1, city: address.city, region: address.region, country: address.country ?? 'CO', phoneNumber: address.phone },
    };
  }

  async byOrder(orderId: string, userId: string) {
    const order = await this.orders.findOne({ where: { id: orderId }, relations: { payments: true } });
    if (!order) throw new NotFoundException('Pedido no encontrado.');
    if (order.userId !== userId) throw new ForbiddenException('No puede consultar este pago.');
    order.payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { orderId: order.id, orderStatus: order.status, payment: order.payments[0] ?? null };
  }

  async handleWompiEvent(event: WompiEvent) {
    const secret = this.config.get<string>('WOMPI_EVENTS_SECRET');
    if (!secret || secret.includes('REEMPLAZAR')) throw new UnauthorizedException('Secreto de eventos Wompi no configurado.');
    const checksum = createEventChecksum(event.data, event.signature.properties, event.timestamp, secret);
    if (checksum !== event.signature.checksum.toUpperCase()) throw new UnauthorizedException('Firma de evento inválida.');
    if (event.event !== 'transaction.updated' || !event.data.transaction) return { received: true };
    const transaction = event.data.transaction;
    const payment = await this.payments.findOne({ where: { reference: transaction.reference }, relations: { order: true } });
    if (!payment) return { received: true, ignored: 'Referencia desconocida.' };
    if (transaction.amount_in_cents !== payment.amountInCents || transaction.currency !== payment.currency) {
      throw new BadRequestException('Monto o moneda del evento no corresponde al pedido.');
    }
    const paymentStatus = this.mapStatus(transaction.status);
    await this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(PaymentEntity);
      const orderRepo = manager.getRepository(OrderEntity);
      const eventRepo = manager.getRepository(ShipmentEventEntity);
      payment.providerTransactionId = transaction.id;
      payment.status = paymentStatus;
      payment.response = event;
      await paymentRepo.save(payment);
      if (paymentStatus === PaymentStatus.APPROVED && payment.order.status === OrderStatus.PENDING_PAYMENT) {
        payment.order.status = OrderStatus.PAID;
        await orderRepo.save(payment.order);
        await eventRepo.save(eventRepo.create({ orderId: payment.orderId, status: OrderStatus.PAID, title: 'Pago confirmado', description: 'Wompi confirmó la aprobación del pago. Iniciaremos la preparación del pedido.' }));
      }
    });
    return { received: true };
  }
  private mapStatus(status: string): PaymentStatus {
    return ({ APPROVED: PaymentStatus.APPROVED, DECLINED: PaymentStatus.DECLINED, ERROR: PaymentStatus.ERROR, VOIDED: PaymentStatus.VOIDED } as Record<string, PaymentStatus>)[status] ?? PaymentStatus.PENDING;
  }
}
