import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DayType } from '../common/enums';
import { timeTransformer } from '../common/transformers/time.transformer';
import { Court } from './court.entity';

@Entity('court_prices')
export class CourtPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'court_id' })
  courtId: number;

  @ManyToOne(() => Court, (c) => c.prices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'court_id' })
  court: Court;

  @Column({ name: 'day_type', type: 'enum', enum: DayType })
  dayType: DayType;

  @Column({ name: 'start_time', type: 'time', transformer: timeTransformer })
  startTime: string;

  @Column({ name: 'end_time', type: 'time', transformer: timeTransformer })
  endTime: string;

  @Column({ name: 'price_per_hour', type: 'int' })
  pricePerHour: number;
}
