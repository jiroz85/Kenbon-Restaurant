import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { StockMovement } from './stock-movement.entity';

@Entity('ingredients')
export class Ingredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantity: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  alertLevel: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => StockMovement, (movement) => movement.ingredient)
  stockMovements: StockMovement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

