import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('Address')
export class AddressEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() userId!: string;
  @Column({ default: 'Principal' }) label!: string;
  @Column() receiver!: string;
  @Column() line1!: string;
  @Column({ nullable: true }) line2?: string;
  @Column() city!: string;
  @Column() region!: string;
  @Column({ default: 'CO' }) country!: string;
  @Column() phone!: string;
  @Column({ nullable: true }) postalCode?: string;
  @Column({ default: false }) isDefault!: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
  @ManyToOne(() => UserEntity, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' }) user!: UserEntity;
}
