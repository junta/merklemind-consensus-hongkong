import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { AdminGuard } from '../guards/admin.guard';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('create-poll')
  @UseGuards(AdminGuard)
  async createPoll(@Body() createPollDto: CreatePollDto) {
    return this.telegramService.createTradePoll(
      createPollDto.pair,
      createPollDto.action,
    );
  }
}
