import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
@ApiTags('Chat n8n') @Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}
  @Post('message') message(@Body() dto: SendMessageDto) { return this.chat.message(dto); }
}
