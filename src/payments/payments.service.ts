import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { Booking } from '../bookings/booking.entity';
import { CreatePaymentDto, QueryPaymentDto } from './dto/payment.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  BookingStatus,
  PaymentStatus,
  PaymentType,
  UserRole,
} from '../common/enums';
import { DP_PERCENT } from '../common/constants';
import { buildMeta } from '../common/utils/pagination.util';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Catat pembayaran (DP / pelunasan).
   * - Customer: status "unpaid" = menunggu verifikasi admin.
   * - Admin   : langsung terverifikasi (mis. bayar tunai di tempat).
   */
  async create(bookingId: number, dto: CreatePaymentDto, user: AuthUser) {
    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException(`Booking #${bookingId} tidak ditemukan`);
    if (user.role !== UserRole.ADMIN && booking.userId !== user.id) {
      throw new ForbiddenException('Anda hanya dapat membayar booking milik sendiri');
    }
    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        `Booking berstatus ${booking.status} tidak dapat dibayar`,
      );
    }

    const existing = await this.payments.find({ where: { bookingId } });
    const committed = existing
      .filter((p) => p.status !== PaymentStatus.REFUNDED)
      .reduce((sum, p) => sum + p.amount, 0);
    const remaining = booking.totalPrice - committed;
    if (remaining <= 0) throw new ConflictException('Booking ini sudah lunas');

    if (dto.paymentType === PaymentType.DP) {
      if (committed > 0) {
        throw new BadRequestException(
          'DP hanya dapat dilakukan sekali. Gunakan paymentType "full" untuk pelunasan',
        );
      }
      const minDp = Math.ceil(booking.totalPrice * DP_PERCENT);
      if (dto.amount < minDp || dto.amount > booking.totalPrice) {
        throw new BadRequestException(
          `Nominal DP minimal ${minDp} (50% dari total ${booking.totalPrice}) dan maksimal ${booking.totalPrice}`,
        );
      }
    } else if (dto.amount !== remaining) {
      throw new BadRequestException(
        `Nominal pelunasan harus sama dengan sisa tagihan: ${remaining}`,
      );
    }

    const payment = await this.payments.save(
      this.payments.create({ ...dto, bookingId, status: PaymentStatus.UNPAID }),
    );

    if (user.role === UserRole.ADMIN) {
      return this.verify(payment.id);
    }
    return payment;
  }

  /** Admin memverifikasi pembayaran -> booking otomatis confirmed bila DP terpenuhi. */
  verify(id: number) {
    return this.dataSource.transaction(async (m) => {
      const payment = await m.findOne(Payment, { where: { id } });
      if (!payment) throw new NotFoundException(`Pembayaran #${id} tidak ditemukan`);
      if (payment.status !== PaymentStatus.UNPAID) {
        throw new BadRequestException(
          `Pembayaran berstatus ${payment.status} tidak dapat diverifikasi`,
        );
      }
      const booking = await m.findOne(Booking, {
        where: { id: payment.bookingId },
        lock: { mode: 'pessimistic_write' },
      });
      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Booking sudah dibatalkan');
      }

      const paidBefore = await this.sumVerified(m, booking.id);
      const totalPaid = paidBefore + payment.amount;

      payment.status =
        totalPaid >= booking.totalPrice ? PaymentStatus.PAID : PaymentStatus.PARTIAL;
      payment.paidAt = new Date();
      await m.save(payment);

      if (
        booking.status === BookingStatus.PENDING &&
        totalPaid >= Math.ceil(booking.totalPrice * DP_PERCENT)
      ) {
        await m.update(Booking, booking.id, { status: BookingStatus.CONFIRMED });
      }
      return m.findOne(Payment, { where: { id }, relations: { booking: true } });
    });
  }

  async refund(id: number) {
    const payment = await this.payments.findOne({ where: { id } });
    if (!payment) throw new NotFoundException(`Pembayaran #${id} tidak ditemukan`);
    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Pembayaran sudah di-refund');
    }
    payment.status = PaymentStatus.REFUNDED;
    return this.payments.save(payment);
  }

  async findAll(q: QueryPaymentDto, user: AuthUser) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;
    const where: FindOptionsWhere<Payment> = {};
    if (q.status) where.status = q.status;
    if (q.booking_id) where.bookingId = q.booking_id;
    if (user.role !== UserRole.ADMIN) where.booking = { userId: user.id };

    const [data, total] = await this.payments.findAndCount({
      where,
      relations: { booking: true },
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(id: number, user: AuthUser) {
    const payment = await this.payments.findOne({
      where: { id },
      relations: { booking: true },
    });
    if (!payment) throw new NotFoundException(`Pembayaran #${id} tidak ditemukan`);
    if (user.role !== UserRole.ADMIN && payment.booking.userId !== user.id) {
      throw new ForbiddenException('Anda hanya dapat melihat pembayaran milik sendiri');
    }
    return payment;
  }

  private async sumVerified(m: EntityManager, bookingId: number): Promise<number> {
    const row = await m
      .createQueryBuilder(Payment, 'p')
      .select('COALESCE(SUM(p.amount), 0)', 'sum')
      .where('p.bookingId = :bookingId', { bookingId })
      .andWhere('p.status IN (:...statuses)', {
        statuses: [PaymentStatus.PARTIAL, PaymentStatus.PAID],
      })
      .getRawOne();
    return Number(row.sum);
  }
}
