import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ContactMessage')
export class ContactMessageEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() name!: string;
  @Column() email!: string;
  @Column({ nullable: true }) phone?: string;
  @Column() subject!: string;
  @Column({ type: 'text' }) message!: string;
  @Column({ default: false }) attended!: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
}
