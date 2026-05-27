import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../common/auth-user.interface';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('Cuenta') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get('me') me(@CurrentUser() user: AuthUser) { return this.users.me(user.sub); }
  @Patch('me') update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) { return this.users.update(user.sub, dto); }
  @Post('me/addresses') addAddress(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressDto) { return this.users.addAddress(user.sub, dto); }
}
