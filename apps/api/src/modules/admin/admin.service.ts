import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContactMessageEntity, OrderEntity, PaymentEntity, ProductEntity, UserEntity } from '../../database/entities';
import { OrderStatus, PaymentStatus } from '../../database/enums';
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(ContactMessageEntity) private readonly contacts: Repository<ContactMessageEntity>,
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
  ) {}
  async summary() {
    const [products, users, orders, pendingOrders, contacts, payments] = await Promise.all([
      this.products.count({ where: { active: true } }),
      this.users.count(),
      this.orders.count(),
      this.orders.count({ where: { status: In([OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.SHIPPED]) } }),
      this.contacts.count({ where: { attended: false } }),
      this.payments.createQueryBuilder('payment').select('COALESCE(SUM(payment."amountInCents"), 0)', 'amount').where('payment.status = :status', { status: PaymentStatus.APPROVED }).getRawOne<{ amount: string }>(),
    ]);
    return { products, users, orders, pendingOrders, contacts, revenue: Math.floor(Number(payments?.amount ?? 0) / 100) };
  }
}
