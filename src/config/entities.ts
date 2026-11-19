import { User } from '../users/user.entity';
import { Court } from '../courts/court.entity';
import { CourtPrice } from '../courts/court-price.entity';
import { Equipment } from '../equipment/equipment.entity';
import { Booking } from '../bookings/booking.entity';
import { BookingEquipment } from '../bookings/booking-equipment.entity';
import { Payment } from '../payments/payment.entity';

export const entities = [
  User,
  Court,
  CourtPrice,
  Equipment,
  Booking,
  BookingEquipment,
  Payment,
];
