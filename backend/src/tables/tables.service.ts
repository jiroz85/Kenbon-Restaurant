import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from '../database/entities/table.entity';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(Table)
    private readonly tablesRepository: Repository<Table>,
  ) {}

  create(dto: CreateTableDto) {
    const table = this.tablesRepository.create({
      label: dto.label,
      capacity: dto.capacity ?? 2,
      isActive: dto.isActive ?? true,
    });
    return this.tablesRepository.save(table);
  }

  findAll() {
    return this.tablesRepository.find({
      order: { label: 'ASC' },
    });
  }

  findOne(id: string) {
    return this.tablesRepository.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateTableDto) {
    const table = await this.tablesRepository.findOne({ where: { id } });
    if (!table) {
      throw new NotFoundException('Table not found');
    }
    if (dto.label && dto.label !== table.label) {
      const existing = await this.tablesRepository.findOne({ where: { label: dto.label } });
      if (existing) {
        throw new ConflictException(`Table with label "${dto.label}" already exists`);
      }
    }
    Object.assign(table, {
      label: dto.label ?? table.label,
      capacity: dto.capacity ?? table.capacity,
      isActive: dto.isActive ?? table.isActive,
    });
    return this.tablesRepository.save(table);
  }

  async remove(id: string) {
    const result = await this.tablesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Table not found');
    }
  }
}
