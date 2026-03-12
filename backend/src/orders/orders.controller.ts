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
  @Roles('CUSTOMER', 'WAITER', 'MANAGER', 'ADMIN')
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    const userId = req.user.id as string;
    return this.ordersService.create(dto, userId);
  }

  @Get()
  @Roles('WAITER', 'MANAGER', 'ADMIN', 'KITCHEN', 'CASHIER')
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('customer/:customerId')
  @Roles('CUSTOMER', 'WAITER', 'MANAGER', 'ADMIN')
  findByCustomer(@Param('customerId') customerId: string, @Req() req: any) {
    // Customers can only see their own orders
    if (req.user.roles.includes('CUSTOMER') && req.user.id !== customerId) {
      throw new Error('Unauthorized');
    }
    return this.ordersService.findByCustomer(customerId);
  }

  @Get('stats')
  @Roles('ADMIN', 'MANAGER', 'CASHIER', 'DELIVERY', 'KITCHEN', 'WAITER')
  getStats(@Req() req: any) {
    console.log('User accessing stats:', req.user);
    console.log('User roles:', req.user.roles);
    return this.ordersService.getStats();
  }

  @Get('status/:status')
  @Roles('WAITER', 'MANAGER', 'ADMIN', 'KITCHEN', 'CASHIER', 'DELIVERY')
  findByStatus(@Param('status') status: OrderStatus) {
    return this.ordersService.findByStatus(status);
  }

  @Get(':id')
  @Roles('WAITER', 'MANAGER', 'ADMIN', 'KITCHEN', 'CASHIER')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('WAITER', 'MANAGER', 'ADMIN', 'KITCHEN', 'CASHIER', 'DELIVERY')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
