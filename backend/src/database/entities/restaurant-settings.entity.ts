import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('restaurant_settings')
export class RestaurantSettings {
  @PrimaryColumn({ default: 'default' })
  id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  serviceChargeRate: string;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: 'en' })
  locale: string;

  @Column({ type: 'json', nullable: true })
  openingHours: {
    [key: string]: { open: string; close: string } | null;
  } | null;

  @Column({ type: 'json', nullable: true })
  holidays: string[] | null;
}
