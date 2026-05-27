import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { ProductEntity, UserEntity } from './entities';
import { Role } from './enums';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get<string>('SEED_DATABASE', 'true') !== 'true') return;
    const email = this.config.get<string>('ADMIN_EMAIL', 'admin@cocoesencia.co').toLowerCase();
    const password = this.config.get<string>('ADMIN_PASSWORD', 'Admin123!');
    const existingAdmin = await this.users.findOne({ where: { email } });
    if (!existingAdmin) {
      await this.users.save(this.users.create({ email, name: 'Administrador CocoEsencia', phone: '3000000000', role: Role.ADMIN, passwordHash: await bcrypt.hash(password, 12) }));
    } else if (existingAdmin.role !== Role.ADMIN) {
      existingAdmin.role = Role.ADMIN;
      await this.users.save(existingAdmin);
    }
    const initialProducts: Array<Partial<ProductEntity> & { slug: string }> = [
      { slug: 'coco-puro', name: 'Coco Puro', category: 'Barra natural', price: 18000, stock: 40, weightGrams: 110, description: 'Jabón sólido fabricado con aceite de coco, espuma cremosa y aroma suave.', ingredients: 'Aceite de coco, hidróxido de sodio, agua destilada y esencia natural.', imageUrl: '/products/coco-puro.svg', featured: true, active: true },
      { slug: 'coco-cafe-exfoliante', name: 'Coco Café', category: 'Barra exfoliante', price: 21000, stock: 28, weightGrams: 110, description: 'Barra artesanal con café molido para una exfoliación delicada.', ingredients: 'Aceite de coco, café molido, hidróxido de sodio y aceite esencial.', imageUrl: '/products/coco-cafe.svg', featured: true, active: true },
      { slug: 'coco-herbal-liquido', name: 'Coco Herbal', category: 'Jabón líquido', price: 32000, stock: 24, weightGrams: 500, description: 'Jabón líquido de 500 ml con notas herbales para uso diario.', ingredients: 'Aceite de coco, hidróxido de potasio, agua purificada y extractos herbales.', imageUrl: '/products/coco-herbal.svg', featured: true, active: true },
      { slug: 'coco-avena-suave', name: 'Coco y Avena', category: 'Barra suave', price: 19500, stock: 35, weightGrams: 110, description: 'Mezcla cremosa con avena coloidal, pensada para una limpieza suave.', ingredients: 'Aceite de coco, avena coloidal, hidróxido de sodio y agua destilada.', imageUrl: '/products/coco-avena.svg', featured: false, active: true },
    ];
    for (const product of initialProducts) {
      const found = await this.products.findOne({ where: { slug: product.slug } });
      if (!found) await this.products.save(this.products.create(product));
    }
    this.logger.log(`Datos iniciales listos. Administrador: ${email}`);
  }
}
