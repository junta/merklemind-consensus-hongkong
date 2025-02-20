import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [() => {
        const config = {
          TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
          CHANNEL_ID: process.env.CHANNEL_ID,
          ADMIN_USER_ID: process.env.ADMIN_USER_ID,
        };
        console.log('Loaded environment variables:', {
          ...config,
          TELEGRAM_BOT_TOKEN: config.TELEGRAM_BOT_TOKEN ? config.TELEGRAM_BOT_TOKEN.slice(0, 5) + '...' : undefined,
        });
        return config;
      }],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'merklemind',
      autoLoadEntities: true,
      synchronize: true, // Be careful with this in production
    }),
    TelegramModule,
  ],
})
export class AppModule {}
