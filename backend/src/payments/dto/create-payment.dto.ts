import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { PaymentProvider } from '../../database/entities/payment.entity';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsEnum(['CASH', 'CARD_TERMINAL', 'STRIPE', 'PAYPAL'])
  provider: PaymentProvider;

  @IsOptional()
  @IsString()
  returnUrl?: string;
}

