import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @IsNotEmpty({ message: 'Nama wajib diisi' })
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'budi@mail.com' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @Matches(/^[0-9+]{8,15}$/, { message: 'Nomor telepon tidak valid' })
  phone?: string;
}
