import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { BookingEquipment } from './booking-equipment.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingsScheduler } from './bookings.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, BookingEquipment])],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsScheduler],
})
export class BookingsModule {}
