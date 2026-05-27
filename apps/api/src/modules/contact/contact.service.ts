import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessageEntity } from '../../database/entities';
import { CreateContactDto } from './dto/create-contact.dto';
@Injectable()
export class ContactService {
  constructor(@InjectRepository(ContactMessageEntity) private readonly contacts: Repository<ContactMessageEntity>) {}
  create(dto: CreateContactDto) { return this.contacts.save(this.contacts.create(dto)); }
  list() { return this.contacts.find({ order: { createdAt: 'DESC' } }); }
}
