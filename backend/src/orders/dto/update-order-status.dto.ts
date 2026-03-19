import { IsEnum } from 'class-validator';
import type { OrderStatus } from '../../database/entities/order.entity';

export class UpdateOrderStatusDto {
  @IsEnum([
    'PENDING_PAYMENT',
    'PAID',
    'IN_KITCHEN',
    'READY',
    'SERVED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ])
  status: OrderStatus;
}
