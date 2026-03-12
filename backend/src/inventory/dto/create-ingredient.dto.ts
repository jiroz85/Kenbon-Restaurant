import { IsBoolean, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumberString()
  quantity: string;

  @IsNumberString()
  alertLevel: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

