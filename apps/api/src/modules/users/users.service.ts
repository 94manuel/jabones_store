import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddressEntity, UserEntity } from '../../database/entities';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(AddressEntity) private readonly addresses: Repository<AddressEntity>,
  ) {}
  async me(userId: string) {
    const user = await this.users.findOne({ where: { id: userId }, relations: { addresses: true } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    user.addresses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const { passwordHash: _hidden, ...profile } = user;
    return profile;
  }
  async update(userId: string, dto: UpdateProfileDto) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    Object.assign(user, dto);
    const saved = await this.users.save(user);
    return { id: saved.id, name: saved.name, email: saved.email, phone: saved.phone, role: saved.role };
  }
  async addAddress(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) await this.addresses.update({ userId }, { isDefault: false });
    return this.addresses.save(this.addresses.create({ ...dto, userId, isDefault: dto.isDefault ?? false }));
  }
}
