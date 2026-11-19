import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Laporan bulanan: pendapatan, lapangan terlaris, jam tersibuk (admin)' })
  @ApiQuery({ name: 'month', required: false, example: '2026-11', description: 'YYYY-MM (default: bulan ini)' })
  revenue(@Query('month') month?: string) {
    return this.reports.revenue(month);
  }
}
