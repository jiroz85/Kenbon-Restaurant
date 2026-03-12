import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { PaymentStatus } from '../../database/entities/payment.entity';

export class UpdatePaymentStatusDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsEnum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'])
  status: PaymentStatus;

  @IsOptional()
  @IsString()
  providerPaymentId?: string;

  @IsOptional()
  @IsString()
  providerPayload?: string;
}

