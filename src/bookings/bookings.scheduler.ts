import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { PAYMENT_TIMEOUT_MINUTES } from '../common/constants';

/** Auto-cancel booking pending yang belum ada pembayaran dalam 1 jam. */
@Injectable()
export class BookingsScheduler {
  private readonly logger = new Logger(BookingsScheduler.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async cancelUnpaidBookings() {
    const cutoff = new Date(Date.now() - PAYMENT_TIMEOUT_MINUTES * 60_000);
    const [, affected] = await this.dataSource.query(
      `UPDATE bookings
          SET status = 'cancelled', updated_at = NOW()
        WHERE status = 'pending'
          AND created_at < $1
          AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = bookings.id)`,
      [cutoff],
    );
    if (affected > 0) {
      this.logger.log(`${affected} booking pending otomatis dibatalkan (tidak dibayar)`);
    }
  }
}
