import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WIB_OFFSET, todayWIB } from '../common/utils/datetime.util';

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async revenue(month?: string) {
    const ym = month ?? todayWIB().slice(0, 7);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(ym)) {
      throw new BadRequestException('Format month harus YYYY-MM, contoh 2026-11');
    }
    const [y, mo] = ym.split('-').map(Number);
    const nextYm = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
    const from = new Date(`${ym}-01T00:00:00${WIB_OFFSET}`);
    const to = new Date(`${nextYm}-01T00:00:00${WIB_OFFSET}`);
    const dateFrom = `${ym}-01`;
    const dateTo = `${nextYm}-01`;

    const [revenueRow] = await this.dataSource.query(
      `SELECT COALESCE(SUM(amount), 0)::int AS total, COUNT(*)::int AS transactions
         FROM payments
        WHERE status IN ('partial','paid') AND paid_at >= $1 AND paid_at < $2`,
      [from, to],
    );

    const bookingsByStatus = await this.dataSource.query(
      `SELECT status, COUNT(*)::int AS total
         FROM bookings
        WHERE booking_date >= $1 AND booking_date < $2
        GROUP BY status ORDER BY status`,
      [dateFrom, dateTo],
    );

    const topCourts = await this.dataSource.query(
      `SELECT c.id AS "courtId", c.name, COUNT(b.id)::int AS "totalBookings"
         FROM bookings b JOIN courts c ON c.id = b.court_id
        WHERE b.booking_date >= $1 AND b.booking_date < $2
          AND b.status IN ('confirmed','completed')
        GROUP BY c.id, c.name
        ORDER BY "totalBookings" DESC, c.name ASC`,
      [dateFrom, dateTo],
    );

    const busiestHours = await this.dataSource.query(
      `SELECT lpad(h::text, 2, '0') || ':00' AS hour, COUNT(*)::int AS "totalBookings"
         FROM bookings b,
              generate_series(EXTRACT(HOUR FROM b.start_time)::int,
                              EXTRACT(HOUR FROM b.end_time)::int - 1) AS h
        WHERE b.booking_date >= $1 AND b.booking_date < $2
          AND b.status IN ('confirmed','completed')
        GROUP BY h
        ORDER BY "totalBookings" DESC, h ASC`,
      [dateFrom, dateTo],
    );

    return {
      month: ym,
      revenue: revenueRow.total,
      paidTransactions: revenueRow.transactions,
      bookingsByStatus,
      topCourts,
      busiestHours,
    };
  }
}
