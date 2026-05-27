import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../../common/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Pagos') @Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Post('checkout') @ApiBearerAuth() @UseGuards(JwtAuthGuard) checkout(@CurrentUser() user: AuthUser, @Body() dto: CreateCheckoutDto) { return this.payments.checkout(user.sub, dto); }
  @Get('order/:orderId') @ApiBearerAuth() @UseGuards(JwtAuthGuard) byOrder(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) { return this.payments.byOrder(orderId, user.sub); }
  @Post('webhooks/wompi') webhook(@Body() event: Parameters<PaymentsService['handleWompiEvent']>[0]) { return this.payments.handleWompiEvent(event); }
}
