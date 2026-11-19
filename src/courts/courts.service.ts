import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Not, Repository } from 'typeorm';
import { Court } from './court.entity';
import { CourtPrice } from './court-price.entity';
import { Booking } from '../bookings/booking.entity';
import { CreateCourtDto, UpdateCourtDto } from './dto/create-court.dto';
import { CreateCourtPriceDto, UpdateCourtPriceDto } from './dto/court-price.dto';
import { QueryCourtDto } from './dto/query-court.dto';
import { buildMeta } from '../common/utils/pagination.util';
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
import { BookingStatus } from '../common/enums';
import { CLOSE_HOUR, MAX_ADVANCE_DAYS, OPEN_HOUR } from '../common/constants';

@Injectable()
export class CourtsService {
  constructor(
    @InjectRepository(Court) private readonly courts: Repository<Court>,
    @InjectRepository(CourtPrice) private readonly prices: Repository<CourtPrice>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
  ) {}

  // ---------- Courts ----------
  create(dto: CreateCourtDto) {
    return this.courts.save(this.courts.create(dto));
  }

  async findAll(q: QueryCourtDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;
    const where: FindOptionsWhere<Court> = {};
    if (q.floor_type) where.floorType = q.floor_type;
    if (q.location_type) where.locationType = q.location_type;
    if (q.is_active !== undefined) where.isActive = q.is_active;
    if (q.search) where.name = ILike(`%${q.search}%`);

    const [data, total] = await this.courts.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(id: number) {
    const court = await this.courts.findOne({ where: { id } });
    if (!court) throw new NotFoundException(`Lapangan #${id} tidak ditemukan`);
    return court;
  }

  async update(id: number, dto: UpdateCourtDto) {
    const court = await this.findOne(id);
    Object.assign(court, dto);
    return this.courts.save(court);
  }

  async remove(id: number) {
    const court = await this.findOne(id);
    await this.courts.remove(court); // gagal 409 bila sudah punya booking
    return { message: `Lapangan #${id} berhasil dihapus` };
  }

  // ---------- Prices ----------
  async getPrices(courtId: number) {
    await this.findOne(courtId);
    return this.prices.find({
      where: { courtId },
      order: { dayType: 'ASC', startTime: 'ASC' },
    });
  }

  async addPrice(courtId: number, dto: CreateCourtPriceDto) {
    await this.findOne(courtId);
    await this.assertPriceValid(courtId, dto.dayType, dto.startTime, dto.endTime);
    return this.prices.save(this.prices.create({ ...dto, courtId }));
  }

  async updatePrice(id: number, dto: UpdateCourtPriceDto) {
    const price = await this.findPrice(id);
    const merged = { ...price, ...dto };
    await this.assertPriceValid(
      price.courtId,
      merged.dayType,
      merged.startTime,
      merged.endTime,
      id,
    );
    Object.assign(price, dto);
    return this.prices.save(price);
  }

  async removePrice(id: number) {
    const price = await this.findPrice(id);
    await this.prices.remove(price);
    return { message: `Harga #${id} berhasil dihapus` };
  }

  private async findPrice(id: number) {
    const price = await this.prices.findOne({ where: { id } });
    if (!price) throw new NotFoundException(`Harga #${id} tidak ditemukan`);
    return price;
  }

  private async assertPriceValid(
    courtId: number,
    dayType: string,
    start: string,
    end: string,
    excludeId?: number,
  ) {
    const s = toMinutes(start);
    const e = toMinutes(end);
    if (e <= s) {
      throw new BadRequestException('endTime harus lebih besar dari startTime');
    }
    const existing = await this.prices.find({
      where: {
        courtId,
        dayType: dayType as any,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });
    const clash = existing.some(
      (p) => s < toMinutes(p.endTime) && e > toMinutes(p.startTime),
    );
    if (clash) {
      throw new ConflictException(
        'Rentang jam bertabrakan dengan harga lain pada tipe hari yang sama',
      );
    }
  }

  // ---------- Availability ----------
  async getAvailability(courtId: number, date?: string) {
    const court = await this.findOne(courtId);
    const day = date ?? todayWIB();
    if (!isValidDateString(day)) {
      throw new BadRequestException('Format date harus YYYY-MM-DD (tanggal valid)');
    }

    const prices = await this.prices.find({
      where: { courtId, dayType: getDayType(day) },
    });
    const booked = await this.bookings
      .createQueryBuilder('b')
      .where('b.courtId = :courtId', { courtId })
      .andWhere('b.bookingDate = :day', { day })
      .andWhere('b.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
      .getMany();

    const now = Date.now();
    const withinWindow = day <= addDays(todayWIB(), MAX_ADVANCE_DAYS);
    const slots = [];
    for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
      const start = `${pad(h)}:00`;
      const end = `${pad(h + 1)}:00`;
      const taken = booked.some((b) => start < b.endTime && end > b.startTime);
      const isFuture = toDateTime(day, start).getTime() > now;
      slots.push({
        start,
        end,
        available: court.isActive && withinWindow && isFuture && !taken,
        price: priceForHour(prices, h),
      });
    }
    return { court: court.name, courtId: court.id, date: day, slots };
  }
}
