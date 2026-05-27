import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderEntity } from './order.entity';
import { ProductEntity } from './product.entity';

@Entity('OrderItem')
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() orderId!: string;
  @Column() productId!: string;
  @Column() name!: string;
  @Column({ type: 'int' }) unitPrice!: number;
  @Column({ type: 'int' }) quantity!: number;
  @Column({ type: 'int' }) subtotal!: number;
  @ManyToOne(() => OrderEntity, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' }) order!: OrderEntity;
  @ManyToOne(() => ProductEntity, (product) => product.orderItems)
  @JoinColumn({ name: 'productId' }) product!: ProductEntity;
}
