import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { ConfigModule } from '@nestjs/config';
import { AdminGuard } from '../guards/admin.guard';

@Module({
  imports: [ConfigModule],
  providers: [TelegramService, AdminGuard],
  controllers: [TelegramController],
  exports: [TelegramService],
})
export class TelegramModule {}
