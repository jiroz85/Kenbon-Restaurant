import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Ingredient } from '../database/entities/ingredient.entity';
import { StockMovement } from '../database/entities/stock-movement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ingredient, StockMovement])],
  providers: [InventoryService],
  controllers: [InventoryController],
})
export class InventoryModule {}
