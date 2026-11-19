import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FloorType, LocationType } from '../common/enums';
import { CourtPrice } from './court-price.entity';
import { Booking } from '../bookings/booking.entity';

@Entity('courts')
export class Court {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'floor_type', type: 'enum', enum: FloorType })
  floorType: FloorType;

  @Column({ name: 'location_type', type: 'enum', enum: LocationType })
  locationType: LocationType;

  @Column({ type: 'int', default: 10 })
  capacity: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => CourtPrice, (p) => p.court)
  prices: CourtPrice[];

  @OneToMany(() => Booking, (b) => b.court)
  bookings: Booking[];
}
