import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantSettings } from '../database/entities/restaurant-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const DEFAULT_ID = 'default';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(RestaurantSettings)
    private readonly settingsRepo: Repository<RestaurantSettings>,
  ) {}

  async get() {
    let settings = await this.settingsRepo.findOne({ where: { id: DEFAULT_ID } });
    if (!settings) {
      settings = this.settingsRepo.create({
        id: DEFAULT_ID,
        taxRate: '0',
        serviceChargeRate: '0',
        currency: 'USD',
        locale: 'en',
      });
      await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async update(dto: UpdateSettingsDto) {
    let settings = await this.settingsRepo.findOne({ where: { id: DEFAULT_ID } });
    if (!settings) {
      settings = this.settingsRepo.create({
        id: DEFAULT_ID,
        taxRate: dto.taxRate ?? '0',
        serviceChargeRate: dto.serviceChargeRate ?? '0',
        currency: dto.currency ?? 'USD',
        locale: dto.locale ?? 'en',
      });
    } else {
      if (dto.taxRate !== undefined) settings.taxRate = dto.taxRate;
      if (dto.serviceChargeRate !== undefined) settings.serviceChargeRate = dto.serviceChargeRate;
      if (dto.currency !== undefined) settings.currency = dto.currency;
      if (dto.locale !== undefined) settings.locale = dto.locale;
      if (dto.openingHours !== undefined) settings.openingHours = dto.openingHours;
      if (dto.holidays !== undefined) settings.holidays = dto.holidays;
    }
    return this.settingsRepo.save(settings);
  }
}
