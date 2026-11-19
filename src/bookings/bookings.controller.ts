import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  QueryBookingDto,
  UpdateBookingDto,
  UpdateBookingStatusDto,
} from './dto/other-booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Buat booking (harga dihitung otomatis, cek bentrok)' })
  @ApiResponse({ status: 201, description: 'Booking dibuat, status pending' })
  @ApiResponse({ status: 400, description: 'Validasi aturan bisnis gagal' })
  @ApiResponse({ status: 404, description: 'Lapangan/perlengkapan tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Jadwal sudah dipesan' })
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: AuthUser) {
    return this.bookings.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar booking (admin: semua, customer: milik sendiri)' })
  findAll(@Query() q: QueryBookingDto, @CurrentUser() user: AuthUser) {
    return this.bookings.findAll(q, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail booking (pemilik / admin)' })
  @ApiResponse({ status: 403, description: 'Bukan booking milik sendiri' })
  @ApiResponse({ status: 404, description: 'Booking tidak ditemukan' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.bookings.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ubah nama tim / catatan booking (pemilik / admin)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.bookings.update(id, dto, user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Batalkan booking (customer minimal 3 jam sebelum main)' })
  @ApiResponse({ status: 200, description: 'Booking dibatalkan' })
  @ApiResponse({ status: 400, description: 'Kurang dari 3 jam sebelum jam main / status tidak valid' })
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.bookings.cancel(id, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tandai booking completed / no_show (admin)' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.bookings.updateStatus(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Hapus booking (admin)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.bookings.remove(id, user);
  }
}
