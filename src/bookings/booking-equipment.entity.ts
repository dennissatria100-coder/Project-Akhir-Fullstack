import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { Equipment } from '../equipment/equipment.entity';

@Entity('booking_equipments')
export class BookingEquipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'booking_id' })
  bookingId: number;

  @ManyToOne(() => Booking, (b) => b.equipments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'equipment_id' })
  equipmentId: number;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipment_id' })
  equipment: Equipment;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  subtotal: number;
}
