import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BookingStatus } from '../../common/enums';
import { DATE_REGEX } from '../../common/constants';

export class UpdateBookingDto {
  @ApiPropertyOptional({ example: 'FC Brantas Baru' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  teamName?: string;

  @ApiPropertyOptional({ example: 'Catatan baru' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: [BookingStatus.NO_SHOW, BookingStatus.COMPLETED], example: BookingStatus.COMPLETED })
  @IsIn([BookingStatus.NO_SHOW, BookingStatus.COMPLETED], {
    message: 'status hanya boleh no_show atau completed',
  })
  status: BookingStatus.NO_SHOW | BookingStatus.COMPLETED;
}

export class QueryBookingDto extends PaginationDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ example: '2026-11-25' })
  @IsOptional()
  @Matches(DATE_REGEX, { message: 'Format date harus YYYY-MM-DD' })
  date?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  court_id?: number;
}
