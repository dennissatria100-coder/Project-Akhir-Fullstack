import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { FloorType, LocationType } from '../../common/enums';

export class QueryCourtDto extends PaginationDto {
  @ApiPropertyOptional({ enum: FloorType })
  @IsOptional()
  @IsEnum(FloorType)
  floor_type?: FloorType;

  @ApiPropertyOptional({ enum: LocationType })
  @IsOptional()
  @IsEnum(LocationType)
  location_type?: LocationType;

  @ApiPropertyOptional({ description: 'Cari berdasarkan nama lapangan', example: 'Lapangan' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter lapangan aktif/nonaktif', example: true })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : value === 'true' || value === true,
  )
  @IsBoolean()
  is_active?: boolean;
}

export class AvailabilityQueryDto {
  @ApiPropertyOptional({ example: '2026-11-25', description: 'Format YYYY-MM-DD' })
  @IsString()
  @IsOptional()
  date?: string;
}
