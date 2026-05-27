import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ChatMessageEntity } from './chat-message.entity';
import { UserEntity } from './user.entity';

@Entity('ChatSession')
export class ChatSessionEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ nullable: true }) userId?: string;
  @Column({ nullable: true }) visitorId?: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
  @ManyToOne(() => UserEntity, (user) => user.chatSessions, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' }) user?: UserEntity;
  @OneToMany(() => ChatMessageEntity, (message) => message.session) messages!: ChatMessageEntity[];
}
