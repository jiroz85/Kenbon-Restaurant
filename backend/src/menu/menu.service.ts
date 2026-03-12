import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCategory } from '../database/entities/menu-category.entity';
import { MenuItem } from '../database/entities/menu-item.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly categoriesRepository: Repository<MenuCategory>,
    @InjectRepository(MenuItem)
    private readonly itemsRepository: Repository<MenuItem>,
  ) {}

  // Categories
  createCategory(dto: CreateCategoryDto) {
    const category = this.categoriesRepository.create(dto);
    return this.categoriesRepository.save(category);
  }

  findAllCategories() {
    return this.categoriesRepository.find({ relations: ['items'] });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    Object.assign(category, dto);
    return this.categoriesRepository.save(category);
  }

  async removeCategory(id: string) {
    const result = await this.categoriesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Category not found');
    }
  }

  // Items
  async createItem(dto: CreateItemDto) {
    const category = await this.categoriesRepository.findOne({ where: { id: dto.categoryId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const item = this.itemsRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      imageUrl: dto.imageUrl,
      isAvailable: dto.isAvailable ?? true,
      category,
    });

    return this.itemsRepository.save(item);
  }

  findAllItems() {
    return this.itemsRepository.find({ relations: ['category'] });
  }

  async updateItem(id: string, dto: UpdateItemDto) {
    const item = await this.itemsRepository.findOne({ where: { id }, relations: ['category'] });
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (dto.categoryId && dto.categoryId !== item.category.id) {
      const category = await this.categoriesRepository.findOne({ where: { id: dto.categoryId } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      item.category = category;
    }

    Object.assign(item, {
      name: dto.name ?? item.name,
      description: dto.description ?? item.description,
      price: dto.price ?? item.price,
      imageUrl: dto.imageUrl ?? item.imageUrl,
      isAvailable: dto.isAvailable ?? item.isAvailable,
    });

    return this.itemsRepository.save(item);
  }

  async removeItem(id: string) {
    const result = await this.itemsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Item not found');
    }
  }
}
