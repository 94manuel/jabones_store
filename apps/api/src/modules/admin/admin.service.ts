import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { ContactMessageEntity, OrderEntity, PaymentEntity, ProductEntity, SiteVisitEntity, UserEntity } from '../../database/entities';
import { OrderStatus, PaymentStatus } from '../../database/enums';
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(ContactMessageEntity) private readonly contacts: Repository<ContactMessageEntity>,
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(SiteVisitEntity) private readonly siteVisits: Repository<SiteVisitEntity>,
  ) {}
  async summary() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [products, users, orders, pendingOrders, contacts, payments, visits, visitsToday] = await Promise.all([
      this.products.count({ where: { active: true } }),
      this.users.count(),
      this.orders.count(),
      this.orders.count({ where: { status: In([OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.SHIPPED]) } }),
      this.contacts.count({ where: { attended: false } }),
      this.payments.createQueryBuilder('payment').select('COALESCE(SUM(payment."amountInCents"), 0)', 'amount').where('payment.status = :status', { status: PaymentStatus.APPROVED }).getRawOne<{ amount: string }>(),
      this.siteVisits.count(),
      this.siteVisits.count({ where: { createdAt: MoreThanOrEqual(startOfToday) } }),
    ]);

    return {
      products,
      users,
      orders,
      pendingOrders,
      contacts,
      revenue: Math.floor(Number(payments?.amount ?? 0) / 100),
      visits,
      visitsToday,
    };
  }

  async listVisits(limit = 25) {
    const take = Math.min(Math.max(limit, 1), 100);
    const visits = await this.siteVisits.find({ order: { createdAt: 'DESC' }, take });

    return visits.map((visit) => ({
      id: visit.id,
      path: visit.path,
      referrer: visit.referrer,
      ipAddress: visit.ipAddress,
      city: visit.city,
      region: visit.region,
      country: visit.country,
      userAgent: visit.userAgent,
      createdAt: visit.createdAt,
    }));
  }
}
