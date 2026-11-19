import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, QueryPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('bookings/:bookingId/payments')
  @ApiOperation({ summary: 'Bayar booking (DP min 50% / pelunasan)' })
  @ApiResponse({ status: 201, description: 'Pembayaran tercatat (customer: menunggu verifikasi, admin: langsung terverifikasi)' })
  @ApiResponse({ status: 400, description: 'Nominal tidak sesuai aturan' })
  @ApiResponse({ status: 404, description: 'Booking tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Booking sudah lunas' })
  create(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.payments.create(bookingId, dto, user);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Daftar pembayaran (admin: semua, customer: milik sendiri)' })
  findAll(@Query() q: QueryPaymentDto, @CurrentUser() user: AuthUser) {
    return this.payments.findAll(q, user);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Detail pembayaran (pemilik / admin)' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.payments.findOne(id, user);
  }

  @Patch('payments/:id/verify')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Verifikasi pembayaran (admin) -> booking otomatis confirmed' })
  @ApiResponse({ status: 200, description: 'Pembayaran terverifikasi, booking confirmed' })
  verify(@Param('id', ParseIntPipe) id: number) {
    return this.payments.verify(id);
  }

  @Patch('payments/:id/refund')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tandai pembayaran sebagai refunded (admin)' })
  refund(@Param('id', ParseIntPipe) id: number) {
    return this.payments.refund(id);
  }
}
