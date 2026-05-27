import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../enums';
import { AddressEntity } from './address.entity';
import { ChatSessionEntity } from './chat-session.entity';
import { OrderEntity } from './order.entity';

@Entity('User')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) email!: string;
  @Column() passwordHash!: string;
  @Column() name!: string;
  @Column({ nullable: true }) phone?: string;
  @Column({ type: 'enum', enum: Role, default: Role.USER }) role!: Role;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
  @OneToMany(() => AddressEntity, (address) => address.user) addresses!: AddressEntity[];
  @OneToMany(() => OrderEntity, (order) => order.user) orders!: OrderEntity[];
  @OneToMany(() => ChatSessionEntity, (session) => session.user) chatSessions!: ChatSessionEntity[];
}
