import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { buildTypeOrmOptions } from './config/typeorm.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CourtsModule } from './courts/courts.module';
import { EquipmentModule } from './equipment/equipment.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => buildTypeOrmOptions(process.env) as TypeOrmModuleOptions,
    }),
    AuthModule,
    UsersModule,
    CourtsModule,
    EquipmentModule,
    BookingsModule,
    PaymentsModule,
    ReportsModule,
  ],
})
export class AppModule {}
