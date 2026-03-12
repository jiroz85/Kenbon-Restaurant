import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Table } from './table.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type OrderStatus =
  | 'NEW'
  | 'IN_KITCHEN'
  | 'READY'
  | 'SERVED'
  | 'OUT_FOR_DELIVERY'
  | 'PAID'
  | 'CANCELLED';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  type: OrderType;

  @Column({ type: 'varchar', default: 'NEW' })
  status: OrderStatus;

  @ManyToOne(() => Table, (table) => table.orders, { nullable: true })
  table?: Table;

  @ManyToOne(() => User, { nullable: true })
  createdBy?: User;

  @Column({ nullable: true })
  customerName?: string;

  @Column({ nullable: true })
  customerPhone?: string;

  @Column({ nullable: true })
  deliveryAddress?: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order)
  payment?: Payment;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxTotal: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  serviceChargeTotal: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountTotal: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  grandTotal: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

