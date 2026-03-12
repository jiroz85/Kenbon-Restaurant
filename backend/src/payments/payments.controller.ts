import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { Roles } from '../auth/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles('CASHIER', 'MANAGER', 'ADMIN')
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Patch('status')
  // Typically called from payment provider webhook handler or internal admin action
  @Roles('MANAGER', 'ADMIN')
  updateStatus(@Body() dto: UpdatePaymentStatusDto) {
    return this.paymentsService.updateStatus(dto);
  }

  @Get('order/:orderId')
  @Roles('CASHIER', 'MANAGER', 'ADMIN')
  findByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.findByOrder(orderId);
  }
}
