import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('SiteVisit')
export class SiteVisitEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ nullable: true }) visitorSessionId?: string;
  @Column() path!: string;
  @Column({ nullable: true }) referrer?: string;
  @Column({ nullable: true }) ipAddress?: string;
  @Column({ nullable: true }) city?: string;
  @Column({ nullable: true }) region?: string;
  @Column({ nullable: true }) country?: string;
  @Column({ type: 'text', nullable: true }) userAgent?: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
}