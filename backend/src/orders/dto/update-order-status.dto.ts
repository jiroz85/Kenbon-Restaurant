import { IsEnum } from 'class-validator';
import type { OrderStatus } from '../../database/entities/order.entity';

export class UpdateOrderStatusDto {
  @IsEnum(['NEW', 'IN_KITCHEN', 'READY', 'SERVED', 'OUT_FOR_DELIVERY', 'PAID', 'CANCELLED'])
  status: OrderStatus;
}

