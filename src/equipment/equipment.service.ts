import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from './equipment.entity';
import { CreateEquipmentDto, UpdateEquipmentDto } from './dto/equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(@InjectRepository(Equipment) private readonly repo: Repository<Equipment>) {}

  findAll() {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  create(dto: CreateEquipmentDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Perlengkapan #${id} tidak ditemukan`);
    return item;
  }

  async update(id: number, dto: UpdateEquipmentDto) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    await this.repo.remove(item);
    return { message: `Perlengkapan #${id} berhasil dihapus` };
  }
}
