import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsNumberString()
  @IsOptional()
  taxRate?: string;

  @IsNumberString()
  @IsOptional()
  serviceChargeRate?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  locale?: string;

  @IsOptional()
  openingHours?: {
    [key: string]: { open: string; close: string } | null;
  };

  @IsOptional()
  holidays?: string[];
}
