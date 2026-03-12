import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Roles } from '../auth/roles.decorator';
import type { OrderStatus } from '../database/entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('WAITER', 'MANAGER', 'ADMIN')
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    const userId = req.user.id as string;
    return this.ordersService.create(dto, userId);
  }

  @Get()
  @Roles('WAITER', 'MANAGER', 'ADMIN', 'KITCHEN', 'CASHIER')
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('stats')
  @Roles('ADMIN', 'MANAGER')
  getStats() {
    return this.ordersService.getStats();
  }

  @Get('status/:status')
  @Roles('WAITER', 'MANAGER', 'ADMIN', 'KITCHEN', 'CASHIER')
  findByStatus(@Param('status') status: OrderStatus) {
    return this.ordersService.findByStatus(status);
  }

  @Get(':id')
  @Roles('WAITER', 'MANAGER', 'ADMIN', 'KITCHEN', 'CASHIER')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('WAITER', 'MANAGER', 'ADMIN', 'KITCHEN', 'CASHIER')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}

