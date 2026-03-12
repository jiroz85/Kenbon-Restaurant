import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { Table } from '../database/entities/table.entity';
import { MenuItem } from '../database/entities/menu-item.entity';
import { User } from '../database/entities/user.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Table, MenuItem, User]),
  ],
  providers: [OrdersService, RealtimeGateway],
  controllers: [OrdersController],
})
export class OrdersModule {}
