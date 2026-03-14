import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // Categories
  @Post('categories')
  @Roles('ADMIN', 'MANAGER')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @Get('categories')
  @Public()
  findAllCategories() {
    return this.menuService.findAllCategories();
  }

  @Patch('categories/:id')
  @Roles('ADMIN', 'MANAGER')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.menuService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @Roles('ADMIN', 'MANAGER')
  removeCategory(@Param('id') id: string) {
    return this.menuService.removeCategory(id);
  }

  // Items
  @Post('items')
  @Roles('ADMIN', 'MANAGER')
  createItem(@Body() dto: CreateItemDto) {
    return this.menuService.createItem(dto);
  }

  @Get('items')
  @Public()
  findAllItems() {
    return this.menuService.findAllItems();
  }

  @Patch('items/:id')
  @Roles('ADMIN', 'MANAGER')
  updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.menuService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @Roles('ADMIN', 'MANAGER')
  removeItem(@Param('id') id: string) {
    return this.menuService.removeItem(id);
  }
}
