import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, Matches, Min } from 'class-validator';
import { DayType } from '../../common/enums';
import { HOUR_REGEX } from '../../common/constants';

const HOUR_MSG = 'Format jam harus HH:00 (jam bulat), contoh 17:00';

export class CreateCourtPriceDto {
  @ApiProperty({ enum: DayType, example: DayType.WEEKDAY })
  @IsEnum(DayType, { message: 'dayType harus weekday/weekend' })
  dayType: DayType;

  @ApiProperty({ example: '08:00' })
  @Matches(HOUR_REGEX, { message: HOUR_MSG })
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @Matches(HOUR_REGEX, { message: HOUR_MSG })
  endTime: string;

  @ApiProperty({ example: 80000 })
  @IsInt()
  @Min(0)
  pricePerHour: number;
}

export class UpdateCourtPriceDto extends PartialType(CreateCourtPriceDto) {}
