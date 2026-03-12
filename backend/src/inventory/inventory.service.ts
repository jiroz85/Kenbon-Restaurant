import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from '../database/entities/ingredient.entity';
import { StockMovement } from '../database/entities/stock-movement.entity';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientsRepository: Repository<Ingredient>,
    @InjectRepository(StockMovement)
    private readonly stockMovementsRepository: Repository<StockMovement>,
  ) {}

  createIngredient(dto: CreateIngredientDto) {
    const ingredient = this.ingredientsRepository.create({
      name: dto.name,
      unit: dto.unit,
      quantity: dto.quantity,
      alertLevel: dto.alertLevel,
      isActive: dto.isActive ?? true,
    });
    return this.ingredientsRepository.save(ingredient);
  }

  findAllIngredients() {
    return this.ingredientsRepository.find();
  }

  async updateIngredient(id: string, dto: UpdateIngredientDto) {
    const ingredient = await this.ingredientsRepository.findOne({ where: { id } });
    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }
    Object.assign(ingredient, dto);
    return this.ingredientsRepository.save(ingredient);
  }

  async recordStockMovement(dto: CreateStockMovementDto) {
    const ingredient = await this.ingredientsRepository.findOne({ where: { id: dto.ingredientId } });
    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    const quantityChange = Number(dto.quantity);
    if (quantityChange <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    let newQuantity = Number(ingredient.quantity);

    if (dto.type === 'INCREASE') {
      newQuantity += quantityChange;
    } else if (dto.type === 'DECREASE') {
      newQuantity -= quantityChange;
    } else if (dto.type === 'ADJUSTMENT') {
      newQuantity = quantityChange;
    }

    if (newQuantity < 0) {
      throw new BadRequestException('Resulting quantity cannot be negative');
    }

    ingredient.quantity = newQuantity.toFixed(3);

    const movement = this.stockMovementsRepository.create({
      ingredient,
      type: dto.type,
      quantity: dto.quantity,
      reason: dto.reason,
    });

    await this.ingredientsRepository.save(ingredient);
    return this.stockMovementsRepository.save(movement);
  }

  async findLowStock() {
    const ingredients = await this.ingredientsRepository.find();
    return ingredients.filter(
      (ing) => Number(ing.quantity) <= Number(ing.alertLevel) && ing.isActive,
    );
  }
}

