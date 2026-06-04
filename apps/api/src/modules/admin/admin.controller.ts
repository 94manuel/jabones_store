import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../../database/enums';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';
@ApiTags('Administración') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN) @Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get('summary') summary() { return this.admin.summary(); }
  @Get('visits') visits(@Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number) { return this.admin.listVisits(limit); }
}
