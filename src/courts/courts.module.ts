import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Court } from './court.entity';
import { CourtPrice } from './court-price.entity';
import { Booking } from '../bookings/booking.entity';
import { CourtsController, CourtPricesController } from './courts.controller';
import { CourtsService } from './courts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Court, CourtPrice, Booking])],
  controllers: [CourtsController, CourtPricesController],
  providers: [CourtsService],
  exports: [CourtsService],
})
export class CourtsModule {}
