import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderStatus } from '../enums';
import { OrderEntity } from './order.entity';

@Entity('ShipmentEvent')
export class ShipmentEventEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() orderId!: string;
  @Column({ type: 'enum', enum: OrderStatus }) status!: OrderStatus;
  @Column() title!: string;
  @Column({ type: 'text' }) description!: string;
  @Column({ nullable: true }) location?: string;
  @CreateDateColumn({ type: 'timestamptz' }) occurredAt!: Date;
  @ManyToOne(() => OrderEntity, (order) => order.shipmentEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' }) order!: OrderEntity;
}
