import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UserRole } from '../common/enums';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const exists = await this.users.findOne({ where: { email } });
    if (exists) throw new ConflictException('Email sudah terdaftar');

    const user = this.users.create({
      name: dto.name,
      email,
      phone: dto.phone,
      password: await bcrypt.hash(dto.password, 10),
      role: UserRole.CUSTOMER, // register publik selalu customer
    });
    const saved = await this.users.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async login(dto: LoginDto) {
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email: dto.email.toLowerCase() })
      .getOne();

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const { password, ...safeUser } = user;
    return { accessToken, user: safeUser };
  }

  async profile(userId: number) {
    return this.users.findOneOrFail({ where: { id: userId } });
  }
}
