import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentStatus } from '../enums';
import { OrderEntity } from './order.entity';

@Entity('Payment')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() orderId!: string;
  @Column({ unique: true }) reference!: string;
  @Column({ default: 'WOMPI' }) provider!: string;
  @Column({ nullable: true, unique: true }) providerTransactionId?: string;
  @Column({ type: 'int' }) amountInCents!: number;
  @Column({ default: 'COP' }) currency!: string;
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING }) status!: PaymentStatus;
  @Column({ type: 'jsonb', nullable: true }) response?: object;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
  @ManyToOne(() => OrderEntity, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' }) order!: OrderEntity;
}
