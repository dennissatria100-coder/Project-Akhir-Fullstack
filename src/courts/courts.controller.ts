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
import { CourtsService } from './courts.service';
import { CreateCourtDto, UpdateCourtDto } from './dto/create-court.dto';
import { CreateCourtPriceDto, UpdateCourtPriceDto } from './dto/court-price.dto';
import { AvailabilityQueryDto, QueryCourtDto } from './dto/query-court.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Courts')
@Controller('courts')
export class CourtsController {
  constructor(private readonly courts: CourtsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar lapangan (filter floor_type, location_type, search, pagination)' })
  findAll(@Query() q: QueryCourtDto) {
    return this.courts.findAll(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail lapangan' })
  @ApiResponse({ status: 404, description: 'Lapangan tidak ditemukan' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.courts.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Cek slot kosong per jam pada tanggal tertentu' })
  @ApiResponse({ status: 200, description: 'Daftar slot 08:00-23:00 beserta harga & ketersediaan' })
  @ApiResponse({ status: 400, description: 'Format tanggal salah' })
  availability(@Param('id', ParseIntPipe) id: number, @Query() q: AvailabilityQueryDto) {
    return this.courts.getAvailability(id, q.date);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tambah lapangan (admin)' })
  @ApiResponse({ status: 201, description: 'Lapangan dibuat' })
  @ApiResponse({ status: 403, description: 'Bukan admin' })
  create(@Body() dto: CreateCourtDto) {
    return this.courts.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ubah lapangan (admin)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCourtDto) {
    return this.courts.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hapus lapangan (admin). Gagal 409 bila sudah punya booking' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.courts.remove(id);
  }

  // ----- Prices -----
  @Get(':id/prices')
  @ApiTags('Court Prices')
  @ApiOperation({ summary: 'Daftar harga lapangan' })
  getPrices(@Param('id', ParseIntPipe) id: number) {
    return this.courts.getPrices(id);
  }

  @Post(':id/prices')
  @ApiTags('Court Prices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tambah harga lapangan (admin)' })
  @ApiResponse({ status: 409, description: 'Rentang jam bertabrakan dengan harga lain' })
  addPrice(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateCourtPriceDto) {
    return this.courts.addPrice(id, dto);
  }
}

@ApiTags('Court Prices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('court-prices')
export class CourtPricesController {
  constructor(private readonly courts: CourtsService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Ubah harga (admin)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCourtPriceDto) {
    return this.courts.updatePrice(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus harga (admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.courts.removePrice(id);
  }
}
