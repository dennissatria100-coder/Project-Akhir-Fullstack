import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BookingStatus } from '../common/enums';
import { timeTransformer } from '../common/transformers/time.transformer';
import { User } from '../users/user.entity';
import { Court } from '../courts/court.entity';
import { BookingEquipment } from './booking-equipment.entity';
import { Payment } from '../payments/payment.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (u) => u.bookings)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'court_id' })
  courtId: number;

  @ManyToOne(() => Court, (c) => c.bookings)
  @JoinColumn({ name: 'court_id' })
  court: Court;

  @Column({ name: 'booking_date', type: 'date' })
  bookingDate: string;

  @Column({ name: 'start_time', type: 'time', transformer: timeTransformer })
  startTime: string;

  @Column({ name: 'end_time', type: 'time', transformer: timeTransformer })
  endTime: string;

  @Column({ name: 'team_name', length: 100 })
  teamName: string;

  @Column({ name: 'player_count', type: 'int' })
  playerCount: number;

  @Column({ name: 'total_price', type: 'int' })
  totalPrice: number;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => BookingEquipment, (be) => be.booking, { cascade: true })
  equipments: BookingEquipment[];

  @OneToMany(() => Payment, (p) => p.booking)
  payments: Payment[];
}
