import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { MenuCategory } from '../database/entities/menu-category.entity';
import { MenuItem } from '../database/entities/menu-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MenuCategory, MenuItem])],
  providers: [MenuService],
  controllers: [MenuController],
})
export class MenuModule {}
