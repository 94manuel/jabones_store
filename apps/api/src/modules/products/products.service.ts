import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../database/entities';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>) {}
  list(featured?: boolean) {
    return this.products.find({ where: featured === undefined ? { active: true } : { active: true, featured }, order: { featured: 'DESC', createdAt: 'DESC' } });
  }
  async bySlug(slug: string) {
    const product = await this.products.findOne({ where: { slug, active: true } });
    if (!product) throw new NotFoundException('Producto no encontrado.');
    return product;
  }
  async create(dto: CreateProductDto) {
    if (await this.products.findOne({ where: { slug: dto.slug } })) throw new ConflictException('Ya existe un producto con ese slug.');
    return this.products.save(this.products.create({ ...dto, featured: dto.featured ?? false, active: dto.active ?? true }));
  }
  async update(id: string, dto: UpdateProductDto) {
    const product = await this.ensure(id);
    Object.assign(product, dto);
    return this.products.save(product);
  }
  async remove(id: string) {
    const product = await this.ensure(id);
    product.active = false;
    return this.products.save(product);
  }
  adminList() { return this.products.find({ order: { createdAt: 'DESC' } }); }
  private async ensure(id: string) {
    const product = await this.products.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado.');
    return product;
  }
}
