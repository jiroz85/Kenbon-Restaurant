import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../database/entities/payment.entity';
import { Order } from '../database/entities/order.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
  ) {}

  async create(dto: CreatePaymentDto) {
    const order = await this.ordersRepository.findOne({ where: { id: dto.orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === 'PAID') {
      throw new BadRequestException('Order is already paid');
    }

    const amount = Number(order.grandTotal);
    if (amount <= 0) {
      throw new BadRequestException('Order total must be greater than zero');
    }

    const payment = this.paymentsRepository.create({
      order,
      amount: order.grandTotal,
      provider: dto.provider,
      status: 'PENDING',
    });

    const saved = await this.paymentsRepository.save(payment);

    return {
      paymentId: saved.id,
      provider: saved.provider,
      amount: saved.amount,
      status: saved.status,
      orderId: order.id,
    };
  }

  async updateStatus(dto: UpdatePaymentStatusDto) {
    const payment = await this.paymentsRepository.findOne({
      where: { id: dto.paymentId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = dto.status;
    payment.providerPaymentId = dto.providerPaymentId ?? payment.providerPaymentId;
    payment.providerPayload = dto.providerPayload ?? payment.providerPayload;

    const savedPayment = await this.paymentsRepository.save(payment);

    if (dto.status === 'SUCCESS') {
      payment.order.status = 'PAID';
      await this.ordersRepository.save(payment.order);
    }

    return savedPayment;
  }

  findByOrder(orderId: string) {
    return this.paymentsRepository.find({
      where: { order: { id: orderId } },
    });
  }
}
