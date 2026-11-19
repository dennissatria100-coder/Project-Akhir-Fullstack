import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUrl, Min } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaymentMethod, PaymentStatus, PaymentType } from '../../common/enums';

export class CreatePaymentDto {
  @ApiProperty({ example: 100000, description: 'DP minimal 50% total; full = sisa tagihan' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: PaymentType, example: PaymentType.DP })
  @IsEnum(PaymentType, { message: 'paymentType harus dp atau full' })
  paymentType: PaymentType;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.TRANSFER })
  @IsEnum(PaymentMethod, { message: 'method harus transfer/cash/e-wallet' })
  method: PaymentMethod;

  @ApiPropertyOptional({ example: 'https://example.com/bukti-transfer.jpg' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  proofUrl?: string;
}

export class QueryPaymentDto extends PaginationDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  booking_id?: number;
}
