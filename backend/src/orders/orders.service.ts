import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Order, OrderStatus } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { Table } from '../database/entities/table.entity';
import { MenuItem } from '../database/entities/menu-item.entity';
import { User } from '../database/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

interface StatusCount {
  status: string;
  count: string;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Table)
    private readonly tablesRepository: Repository<Table>,
    @InjectRepository(MenuItem)
    private readonly menuItemsRepository: Repository<MenuItem>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(dto: CreateOrderDto, userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let table: Table | undefined;
    if (dto.type === 'DINE_IN' && dto.tableId) {
      table =
        (await this.tablesRepository.findOne({ where: { id: dto.tableId } })) ??
        undefined;
      if (!table) {
        throw new NotFoundException('Table not found');
      }
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const items: OrderItem[] = [];
    let subtotal = 0;

    for (const input of dto.items) {
      const menuItem = await this.menuItemsRepository.findOne({
        where: { id: input.menuItemId },
      });
      if (!menuItem) {
        throw new NotFoundException(`Menu item not found: ${input.menuItemId}`);
      }

      const unitPrice = input.overrideUnitPrice
        ? Number(input.overrideUnitPrice)
        : Number(menuItem.price);
      const lineTotal = unitPrice * input.quantity;
      subtotal += lineTotal;

      const orderItem = this.orderItemsRepository.create({
        menuItem,
        quantity: input.quantity,
        unitPrice: unitPrice.toFixed(2),
        lineTotal: lineTotal.toFixed(2),
        notes: input.notes,
      });
      items.push(orderItem);
    }

    const taxTotal = 0;
    const serviceChargeTotal = 0;
    const discountTotal = 0;
    const grandTotal = subtotal + taxTotal + serviceChargeTotal - discountTotal;

    const order = this.ordersRepository.create({
      type: dto.type,
      table,
      createdBy: user,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      deliveryAddress: dto.deliveryAddress,
      items,
      subtotal: subtotal.toFixed(2),
      taxTotal: taxTotal.toFixed(2),
      serviceChargeTotal: serviceChargeTotal.toFixed(2),
      discountTotal: discountTotal.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    });

    const saved = await this.ordersRepository.save(order);
    this.realtimeGateway.emitOrderCreated(saved);
    return saved;
  }

  findAll() {
    return this.ordersRepository.find({
      relations: ['items', 'items.menuItem', 'table', 'createdBy', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.menuItem', 'table', 'createdBy', 'payment'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  findByStatus(status: OrderStatus) {
    return this.ordersRepository.find({
      where: { status },
      relations: ['items', 'items.menuItem', 'table', 'createdBy'],
      order: { createdAt: 'ASC' },
    });
  }

  findByCustomer(customerId: string) {
    return this.ordersRepository.find({
      where: { createdBy: { id: customerId } },
      relations: ['items', 'items.menuItem', 'table', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, user?: any) {
    console.log('OrdersService: Updating order status:', {
      id,
      status: dto.status,
      userRole: user?.roles?.[0],
    });

    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['createdBy', 'items', 'table'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    console.log('OrdersService: Found order:', {
      id: order.id,
      currentStatus: order.status,
      createdBy: order.createdBy?.id,
    });

    // Validation for customers: can only update their own orders to DELIVERED
    if (user?.roles?.includes('CUSTOMER')) {
      if (order.createdBy?.id !== user.id) {
        throw new BadRequestException('You can only update your own orders');
      }
      if (dto.status !== 'DELIVERED') {
        throw new BadRequestException(
          'Customers can only mark orders as delivered',
        );
      }
      if (order.status !== 'OUT_FOR_DELIVERY') {
        throw new BadRequestException(
          'Order must be out for delivery before marking as delivered',
        );
      }
    }

    order.status = dto.status;
    const saved = await this.ordersRepository.save(order);

    console.log(
      'OrdersService: Order status updated, emitting WebSocket event:',
      { id: saved.id, newStatus: saved.status },
    );
    this.realtimeGateway.emitOrderStatusUpdated(saved);

    return saved;
  }

  async remove(id: string) {
    console.log('OrdersService: Deleting order:', { id });

    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Delete order items first (due to foreign key constraint)
    for (const item of order.items) {
      await this.orderItemsRepository.remove(item);
    }

    // Delete the order
    const deleted = await this.ordersRepository.remove(order);

    console.log('OrdersService: Order deleted successfully:', { id });

    // Emit WebSocket event for order deletion
    this.realtimeGateway.emitOrderDeleted(id);

    return { message: 'Order deleted successfully', orderId: id };
  }

  async getStats() {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const [allOrders, todayOrders, byStatus] = await Promise.all([
      this.ordersRepository.find(),
      this.ordersRepository.find({
        where: {
          createdAt: Between(todayStart, todayEnd),
        },
      }),
      this.ordersRepository
        .createQueryBuilder('o')
        .select('o.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('o.status')
        .getRawMany<StatusCount>(),
    ]);

    const totalRevenue = allOrders
      .filter((o) => o.status === 'PAID')
      .reduce((sum, o) => sum + Number(o.grandTotal), 0);

    const todayRevenue = todayOrders
      .filter((o) => o.status === 'PAID')
      .reduce((sum, o) => sum + Number(o.grandTotal), 0);

    const statusCounts: Record<string, number> = {};
    for (const row of byStatus) {
      statusCounts[row.status] = parseInt(row.count, 10);
    }

    return {
      totalOrders: allOrders.length,
      todayOrders: todayOrders.length,
      totalRevenue: totalRevenue.toFixed(2),
      todayRevenue: todayRevenue.toFixed(2),
      byStatus: statusCounts,
    };
  }
}
