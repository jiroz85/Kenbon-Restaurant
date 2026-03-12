import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { Roles } from '../auth/roles.decorator';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('ingredients')
  @Roles('ADMIN', 'MANAGER')
  createIngredient(@Body() dto: CreateIngredientDto) {
    return this.inventoryService.createIngredient(dto);
  }

  @Get('ingredients')
  @Roles('ADMIN', 'MANAGER', 'KITCHEN')
  findAllIngredients() {
    return this.inventoryService.findAllIngredients();
  }

  @Patch('ingredients/:id')
  @Roles('ADMIN', 'MANAGER')
  updateIngredient(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    return this.inventoryService.updateIngredient(id, dto);
  }

  @Post('stock-movements')
  @Roles('ADMIN', 'MANAGER', 'KITCHEN')
  recordStockMovement(@Body() dto: CreateStockMovementDto) {
    return this.inventoryService.recordStockMovement(dto);
  }

  @Get('low-stock')
  @Roles('ADMIN', 'MANAGER', 'KITCHEN')
  findLowStock() {
    return this.inventoryService.findLowStock();
  }
}
