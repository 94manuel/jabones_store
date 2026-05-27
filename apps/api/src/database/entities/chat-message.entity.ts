import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChatSessionEntity } from './chat-session.entity';

@Entity('ChatMessage')
export class ChatMessageEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() sessionId!: string;
  @Column() role!: string;
  @Column({ type: 'text' }) content!: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @ManyToOne(() => ChatSessionEntity, (session) => session.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' }) session!: ChatSessionEntity;
}
