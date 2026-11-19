import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { buildMeta } from '../common/utils/pagination.util';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async findAll(q: PaginationDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;
    const [data, total] = await this.users.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(id: number, actor: AuthUser) {
    this.assertAccess(id, actor);
    return this.getOrFail(id);
  }

  async update(id: number, dto: UpdateUserDto, actor: AuthUser) {
    this.assertAccess(id, actor);
    if (dto.role !== undefined && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Hanya admin yang dapat mengubah role');
    }
    const user = await this.getOrFail(id);
    const { password, ...rest } = dto;
    Object.assign(user, rest);
    if (password) user.password = await bcrypt.hash(password, 10);
    await this.users.save(user);
    return this.getOrFail(id);
  }

  async remove(id: number, actor: AuthUser) {
    this.assertAccess(id, actor);
    const user = await this.getOrFail(id);
    await this.users.remove(user);
    return { message: `User #${id} berhasil dihapus` };
  }

  private assertAccess(id: number, actor: AuthUser) {
    if (actor.role !== UserRole.ADMIN && actor.id !== id) {
      throw new ForbiddenException('Anda hanya dapat mengakses data milik sendiri');
    }
  }

  private async getOrFail(id: number) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} tidak ditemukan`);
    return user;
  }
}
