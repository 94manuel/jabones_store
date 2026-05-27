import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { OrderItemEntity } from './order-item.entity';

@Entity('Product')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) slug!: string;
  @Column() name!: string;
  @Column({ type: 'text' }) description!: string;
  @Column({ type: 'text' }) ingredients!: string;
  @Column() category!: string;
  @Column({ type: 'int' }) price!: number;
  @Column({ type: 'int', default: 0 }) stock!: number;
  @Column({ type: 'int' }) weightGrams!: number;
  @Column() imageUrl!: string;
  @Column({ default: false }) featured!: boolean;
  @Column({ default: true }) active!: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
  @OneToMany(() => OrderItemEntity, (item) => item.product) orderItems!: OrderItemEntity[];
}
