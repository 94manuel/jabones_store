import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { OrderStatus } from '../enums';
import { OrderItemEntity } from './order-item.entity';
import { PaymentEntity } from './payment.entity';
import { ShipmentEventEntity } from './shipment-event.entity';
import { UserEntity } from './user.entity';

@Entity('Order')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) reference!: string;
  @Column({ unique: true }) trackingCode!: string;
  @Column() userId!: string;
  @Column({ type: 'int' }) subtotal!: number;
  @Column({ type: 'int' }) shippingCost!: number;
  @Column({ type: 'int' }) total!: number;
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING_PAYMENT }) status!: OrderStatus;
  @Column({ type: 'jsonb' }) addressSnapshot!: Record<string, string>;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
  @ManyToOne(() => UserEntity, (user) => user.orders)
  @JoinColumn({ name: 'userId' }) user!: UserEntity;
  @OneToMany(() => OrderItemEntity, (item) => item.order) items!: OrderItemEntity[];
  @OneToMany(() => PaymentEntity, (payment) => payment.order) payments!: PaymentEntity[];
  @OneToMany(() => ShipmentEventEntity, (event) => event.order) shipmentEvents!: ShipmentEventEntity[];
}
