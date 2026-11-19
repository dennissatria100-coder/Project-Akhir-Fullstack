import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { BookingEquipment } from './booking-equipment.entity';
import { Court } from '../courts/court.entity';
import { CourtPrice } from '../courts/court-price.entity';
import { Equipment } from '../equipment/equipment.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  QueryBookingDto,
  UpdateBookingDto,
  UpdateBookingStatusDto,
} from './dto/other-booking.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { BookingStatus, UserRole } from '../common/enums';
import {
  CANCEL_LIMIT_HOURS,
  CLOSE_HOUR,
  MAX_ADVANCE_DAYS,
  MAX_DURATION_HOURS,
  MAX_PENDING_BOOKINGS,
  MIN_DURATION_HOURS,
  OPEN_HOUR,
} from '../common/constants';
import {
  addDays,
  getDayType,
  isValidDateString,
  pad,
  priceForHour,
  toDateTime,
  toMinutes,
  todayWIB,
} from '../common/utils/datetime.util';
import { buildMeta } from '../common/utils/pagination.util';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    private readonly dataSource: DataSource,
  ) {}

  // ------------------------------------------------------------------
  // CREATE
  // ------------------------------------------------------------------
  async create(dto: CreateBookingDto, user: AuthUser) {
    const { courtId, bookingDate, startTime, endTime } = dto;

    // --- validasi waktu (tanpa DB) ---
    if (!isValidDateString(bookingDate)) {
      throw new BadRequestException('bookingDate bukan tanggal yang valid');
    }
    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);
    if (endMin <= startMin) {
      throw new BadRequestException('endTime harus lebih besar dari startTime');
    }
    if (startMin < OPEN_HOUR * 60 || endMin > CLOSE_HOUR * 60) {
      throw new BadRequestException(
        `Jam operasional ${pad(OPEN_HOUR)}:00 - ${pad(CLOSE_HOUR)}:00`,
      );
    }
    const duration = (endMin - startMin) / 60;
    if (duration < MIN_DURATION_HOURS || duration > MAX_DURATION_HOURS) {
      throw new BadRequestException(
        `Durasi booking minimal ${MIN_DURATION_HOURS} jam dan maksimal ${MAX_DURATION_HOURS} jam`,
      );
    }
    const today = todayWIB();
    if (bookingDate < today) {
      throw new BadRequestException('Tanggal booking tidak boleh di masa lalu');
    }
    if (bookingDate > addDays(today, MAX_ADVANCE_DAYS)) {
      throw new BadRequestException(
        `Booking maksimal ${MAX_ADVANCE_DAYS} hari ke depan`,
      );
    }
    if (toDateTime(bookingDate, startTime).getTime() <= Date.now()) {
      throw new BadRequestException('Jam mulai harus lebih besar dari jam sekarang');
    }

    // --- transaksi: kunci baris lapangan agar tidak ada double booking ---
    const bookingId = await this.dataSource.transaction(async (m) => {
      const court = await m.findOne(Court, {
        where: { id: courtId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!court) throw new NotFoundException(`Lapangan #${courtId} tidak ditemukan`);
      if (!court.isActive) {
        throw new BadRequestException('Lapangan sedang tidak aktif dan tidak dapat dibooking');
      }
      if (dto.playerCount > court.capacity) {
        throw new BadRequestException(
          `playerCount maksimal ${court.capacity} pemain untuk ${court.name}`,
        );
      }

      const pending = await m.count(Booking, {
        where: { userId: user.id, status: BookingStatus.PENDING },
      });
      if (pending >= MAX_PENDING_BOOKINGS) {
        throw new BadRequestException(
          `Maksimal ${MAX_PENDING_BOOKINGS} booking berstatus pending. Selesaikan pembayaran terlebih dahulu`,
        );
      }

      // cek bentrok: start < existing_end AND end > existing_start (selain cancelled)
      const overlap = await m
        .createQueryBuilder(Booking, 'b')
        .where('b.courtId = :courtId', { courtId })
        .andWhere('b.bookingDate = :bookingDate', { bookingDate })
        .andWhere('b.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
        .andWhere('b.startTime < :endTime AND b.endTime > :startTime', {
          startTime,
          endTime,
        })
        .getCount();
      if (overlap > 0) throw new ConflictException('Jadwal sudah dipesan');

      // hitung harga lapangan per jam
      const prices = await m.find(CourtPrice, {
        where: { courtId, dayType: getDayType(bookingDate) },
      });
      let courtTotal = 0;
      for (let h = startMin / 60; h < endMin / 60; h++) {
        const p = priceForHour(prices, h);
        if (p === null) {
          throw new BadRequestException(
            `Harga untuk jam ${pad(h)}:00 belum diatur pada ${court.name}`,
          );
        }
        courtTotal += p;
      }

      // perlengkapan
      let equipmentTotal = 0;
      const rows: BookingEquipment[] = [];
      if (dto.equipments?.length) {
        const ids = dto.equipments.map((e) => e.equipmentId);
        if (new Set(ids).size !== ids.length) {
          throw new BadRequestException('equipmentId tidak boleh duplikat');
        }
        const items = await m.find(Equipment, {
          where: { id: In(ids) },
          order: { id: 'ASC' },
          lock: { mode: 'pessimistic_write' },
        });
        for (const req of dto.equipments) {
          const item = items.find((i) => i.id === req.equipmentId);
          if (!item) throw new NotFoundException(`Perlengkapan #${req.equipmentId} tidak ditemukan`);
          if (!item.isActive) {
            throw new BadRequestException(`Perlengkapan "${item.name}" sedang tidak tersedia`);
          }
          const used = await m
            .createQueryBuilder(BookingEquipment, 'be')
            .innerJoin('be.booking', 'b')
            .select('COALESCE(SUM(be.quantity), 0)', 'used')
            .where('be.equipmentId = :eid', { eid: item.id })
            .andWhere('b.bookingDate = :bookingDate', { bookingDate })
            .andWhere('b.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
            .andWhere('b.startTime < :endTime AND b.endTime > :startTime', {
              startTime,
              endTime,
            })
            .getRawOne();
          const available = item.stock - Number(used.used);
          if (req.quantity > available) {
            throw new BadRequestException(
              `Stok "${item.name}" tidak cukup pada slot ini (tersisa ${Math.max(available, 0)})`,
            );
          }
          const subtotal = item.rentalPrice * req.quantity;
          equipmentTotal += subtotal;
          rows.push(
            m.create(BookingEquipment, {
              equipmentId: item.id,
              quantity: req.quantity,
              subtotal,
            }),
          );
        }
      }

      const booking = m.create(Booking, {
        userId: user.id,
        courtId,
        bookingDate,
        startTime,
        endTime,
        teamName: dto.teamName,
        playerCount: dto.playerCount,
        notes: dto.notes,
        totalPrice: courtTotal + equipmentTotal,
        status: BookingStatus.PENDING,
        equipments: rows,
      });
      const saved = await m.save(booking);
      return saved.id;
    });

    return this.findOne(bookingId, user);
  }

  // ------------------------------------------------------------------
  // READ
  // ------------------------------------------------------------------
  async findAll(q: QueryBookingDto, user: AuthUser) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;
    const isAdmin = user.role === UserRole.ADMIN;

    const where: FindOptionsWhere<Booking> = {};
    if (!isAdmin) where.userId = user.id;
    if (q.status) where.status = q.status;
    if (q.date) where.bookingDate = q.date;
    if (q.court_id) where.courtId = q.court_id;

    const [data, total] = await this.bookings.findAndCount({
      where,
      relations: {
        court: true,
        user: isAdmin,
        equipments: { equipment: true },
        payments: true,
      },
      order: { bookingDate: 'DESC', startTime: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(id: number, user: AuthUser) {
    const booking = await this.bookings.findOne({
      where: { id },
      relations: {
        court: true,
        user: true,
        equipments: { equipment: true },
        payments: true,
      },
    });
    if (!booking) throw new NotFoundException(`Booking #${id} tidak ditemukan`);
    this.assertOwnerOrAdmin(booking, user);
    return booking;
  }

  // ------------------------------------------------------------------
  // UPDATE / CANCEL / STATUS / DELETE
  // ------------------------------------------------------------------
  async update(id: number, dto: UpdateBookingDto, user: AuthUser) {
    const booking = await this.findOne(id, user);
    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.NO_SHOW
    ) {
      throw new BadRequestException(
        `Booking berstatus ${booking.status} tidak dapat diubah`,
      );
    }
    if (dto.teamName !== undefined) booking.teamName = dto.teamName;
    if (dto.notes !== undefined) booking.notes = dto.notes;
    await this.bookings.save({ id: booking.id, teamName: booking.teamName, notes: booking.notes });
    return this.findOne(id, user);
  }

  async cancel(id: number, user: AuthUser) {
    const booking = await this.findOne(id, user);
    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        `Booking berstatus ${booking.status} tidak dapat dibatalkan`,
      );
    }
    if (user.role !== UserRole.ADMIN) {
      const hoursLeft =
        (toDateTime(booking.bookingDate, booking.startTime).getTime() - Date.now()) /
        3_600_000;
      if (hoursLeft < CANCEL_LIMIT_HOURS) {
        throw new BadRequestException(
          `Pembatalan hanya dapat dilakukan minimal ${CANCEL_LIMIT_HOURS} jam sebelum jam main`,
        );
      }
    }
    await this.bookings.update(id, { status: BookingStatus.CANCELLED });
    return this.findOne(id, user);
  }

  async updateStatus(id: number, dto: UpdateBookingStatusDto, user: AuthUser) {
    const booking = await this.findOne(id, user);
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Hanya booking berstatus confirmed yang dapat ditandai completed/no_show',
      );
    }
    if (toDateTime(booking.bookingDate, booking.startTime).getTime() > Date.now()) {
      throw new BadRequestException('Booking belum dimulai, status belum dapat diubah');
    }
    await this.bookings.update(id, { status: dto.status });
    return this.findOne(id, user);
  }

  async remove(id: number, user: AuthUser) {
    const booking = await this.findOne(id, user);
    await this.bookings.remove(booking);
    return { message: `Booking #${id} berhasil dihapus` };
  }

  // ------------------------------------------------------------------
  private assertOwnerOrAdmin(booking: Booking, user: AuthUser) {
    if (user.role !== UserRole.ADMIN && booking.userId !== user.id) {
      throw new ForbiddenException('Anda hanya dapat mengakses booking milik sendiri');
    }
  }
}
