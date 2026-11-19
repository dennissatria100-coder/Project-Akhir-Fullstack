import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../common/enums';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Budi S.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '081298765432' })
  @IsOptional()
  @Matches(/^[0-9+]{8,15}$/, { message: 'Nomor telepon tidak valid' })
  phone?: string;

  @ApiPropertyOptional({ example: 'passwordBaru123' })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'Hanya admin yang boleh mengubah role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
