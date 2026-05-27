import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserEntity } from '../../database/entities';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.users.findOne({ where: { email } })) throw new ConflictException('El correo ya está registrado.');
    const user = await this.users.save(this.users.create({ name: dto.name.trim(), email, phone: dto.phone, passwordHash: await bcrypt.hash(dto.password, 12) }));
    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email.toLowerCase().trim() } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Credenciales inválidas.');
    return this.issueToken(user);
  }

  private issueToken(user: Pick<UserEntity, 'id' | 'email' | 'name' | 'role'>) {
    const payload = { sub: user.id, email: user.email, name: user.name, role: user.role };
    return { accessToken: this.jwt.sign(payload), expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '1d'), user: payload };
  }
}
