import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'Bola Futsal' })
  @IsString()
  @IsNotEmpty({ message: 'Nama perlengkapan wajib diisi' })
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 15000 })
  @IsInt()
  @Min(0)
  rentalPrice: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {}
