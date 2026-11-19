import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { DATE_REGEX, HOUR_REGEX } from '../../common/constants';

const HOUR_MSG = 'Format jam harus HH:00 (jam bulat), contoh 19:00';

export class BookingEquipmentItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  equipmentId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateBookingDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  courtId: number;

  @ApiProperty({ example: '2026-11-25', description: 'YYYY-MM-DD' })
  @Matches(DATE_REGEX, { message: 'Format bookingDate harus YYYY-MM-DD' })
  bookingDate: string;

  @ApiProperty({ example: '19:00' })
  @Matches(HOUR_REGEX, { message: HOUR_MSG })
  startTime: string;

  @ApiProperty({ example: '21:00' })
  @Matches(HOUR_REGEX, { message: HOUR_MSG })
  endTime: string;

  @ApiProperty({ example: 'FC Brantas' })
  @IsString()
  @IsNotEmpty({ message: 'Nama tim wajib diisi' })
  @MaxLength(100)
  teamName: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  playerCount: number;

  @ApiPropertyOptional({ example: 'Mohon siapkan lampu tambahan' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [BookingEquipmentItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingEquipmentItemDto)
  equipments?: BookingEquipmentItemDto[];
}
