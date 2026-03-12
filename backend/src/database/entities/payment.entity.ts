import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type PaymentProvider = 'CASH' | 'CARD_TERMINAL' | 'STRIPE' | 'PAYPAL';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Order, (order) => order.payment, { nullable: false })
  @JoinColumn()
  order: Order;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', default: 'PENDING' })
  status: PaymentStatus;

  @Column({ type: 'varchar' })
  provider: PaymentProvider;

  @Column({ nullable: true })
  providerPaymentId?: string;

  @Column({ nullable: true })
  providerPayload?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

