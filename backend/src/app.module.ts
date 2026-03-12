import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { TablesModule } from './tables/tables.module';
import { RealtimeGateway } from './realtime/realtime.gateway';
import { InventoryModule } from './inventory/inventory.module';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'kenbon',
      password: process.env.DB_PASSWORD || 'kenbon',
      database: process.env.DB_NAME || 'kenbon_restaurant',
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
    MenuModule,
    OrdersModule,
    TablesModule,
    InventoryModule,
    PaymentsModule,
    UsersModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService, RealtimeGateway],
})
export class AppModule {}
