import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessageEntity, ChatSessionEntity } from '../../database/entities';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSessionEntity) private readonly sessions: Repository<ChatSessionEntity>,
    @InjectRepository(ChatMessageEntity) private readonly messages: Repository<ChatMessageEntity>,
    private readonly config: ConfigService,
  ) {}

  async message(dto: SendMessageDto) {
    const session = dto.sessionId ? await this.sessions.findOne({ where: { id: dto.sessionId } }) : undefined;
    const activeSession = session ?? await this.sessions.save(this.sessions.create({ visitorId: dto.visitorId }));
    await this.messages.save(this.messages.create({ sessionId: activeSession.id, role: 'user', content: dto.message }));
    const webhook = this.config.get<string>('N8N_CHAT_WEBHOOK_URL');
    let output = '¡Hola! Gracias por escribir a CocoEsencia. Puedo ayudarte con ingredientes, disponibilidad, pagos o seguimiento de pedidos.';
    if (webhook) {
      const token = this.config.get<string>('N8N_WEBHOOK_AUTH_TOKEN');
      try {
        const response = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ message: dto.message, sessionId: activeSession.id, customer: { visitorId: dto.visitorId } }),
        });
        if (response.ok) {
          const payload = await response.json() as { output?: string; text?: string; response?: string };
          output = payload.output ?? payload.text ?? payload.response ?? output;
        }
      } catch {
        output = 'Nuestro asistente está temporalmente sin conexión. Déjanos tu mensaje en Contacto y responderemos pronto.';
      }
    }
    await this.messages.save(this.messages.create({ sessionId: activeSession.id, role: 'assistant', content: output }));
    return { sessionId: activeSession.id, output };
  }
}
