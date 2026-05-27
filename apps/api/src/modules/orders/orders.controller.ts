import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../../database/enums';
import { AuthUser } from '../../common/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('Pedidos') @Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Get('tracking/:code') tracking(@Param('code') code: string) { return this.orders.tracking(code); }
  @Post() @ApiBearerAuth() @UseGuards(JwtAuthGuard) create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) { return this.orders.create(user.sub, dto); }
  @Get('mine') @ApiBearerAuth() @UseGuards(JwtAuthGuard) mine(@CurrentUser() user: AuthUser) { return this.orders.mine(user.sub); }
  @Get('mine/:id') @ApiBearerAuth() @UseGuards(JwtAuthGuard) one(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.orders.oneForUser(id, user.sub); }
  @Get('admin/all') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN) adminList() { return this.orders.adminList(); }
  @Patch('admin/:id/status') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN) updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) { return this.orders.updateStatus(id, dto); }
}
