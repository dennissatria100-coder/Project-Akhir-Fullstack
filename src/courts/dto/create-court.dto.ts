import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FloorType, LocationType } from '../../common/enums';

export class CreateCourtDto {
  @ApiProperty({ example: 'Lapangan A' })
  @IsString()
  @IsNotEmpty({ message: 'Nama lapangan wajib diisi' })
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: FloorType, example: FloorType.VINYL })
  @IsEnum(FloorType, { message: 'floorType harus vinyl/interlock/sintetis/parquet' })
  floorType: FloorType;

  @ApiProperty({ enum: LocationType, example: LocationType.INDOOR })
  @IsEnum(LocationType, { message: 'locationType harus indoor/outdoor' })
  locationType: LocationType;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  capacity?: number;

  @ApiPropertyOptional({ example: 'Lantai vinyl standar FIFA, indoor ber-AC' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/lapangan-a.jpg' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCourtDto extends PartialType(CreateCourtDto) {}
