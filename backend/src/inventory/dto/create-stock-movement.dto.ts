import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';
import type { StockMovementType } from '../../database/entities/stock-movement.entity';

export class CreateStockMovementDto {
  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @IsEnum(['INCREASE', 'DECREASE', 'ADJUSTMENT'])
  type: StockMovementType;

  @IsNumberString()
  quantity: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

