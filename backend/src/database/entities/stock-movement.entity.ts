import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ingredient } from './ingredient.entity';

export type StockMovementType = 'INCREASE' | 'DECREASE' | 'ADJUSTMENT';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.stockMovements, { nullable: false })
  ingredient: Ingredient;

  @Column({ type: 'varchar' })
  type: StockMovementType;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: string;

  @Column({ nullable: true })
  reason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

