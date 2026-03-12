import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested, IsInt, Min, IsNumberString } from 'class-validator';
import { Type } from 'class-transformer';
import type { OrderType } from '../../database/entities/order.entity';

class OrderItemInput {
  @IsString()
  @IsNotEmpty()
  menuItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumberString()
  overrideUnitPrice?: string;
}

export class CreateOrderDto {
  @IsEnum(['DINE_IN', 'TAKEAWAY', 'DELIVERY'])
  type: OrderType;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];
}

