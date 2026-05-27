import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

class OrderItemDto {
  @ApiProperty() @IsString() productId!: string;
  @ApiProperty() @IsInt() @Min(1) quantity!: number;
}
class ShippingAddressDto {
  @ApiProperty() @IsString() receiver!: string;
  @ApiProperty() @IsString() line1!: string;
  @ApiProperty() @IsString() city!: string;
  @ApiProperty() @IsString() region!: string;
  @ApiProperty({ default: 'CO' }) @IsString() country: string = 'CO';
  @ApiProperty() @IsString() phone!: string;
}
export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] }) @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => OrderItemDto) items!: OrderItemDto[];
  @ApiProperty({ type: ShippingAddressDto }) @ValidateNested() @Type(() => ShippingAddressDto) shippingAddress!: ShippingAddressDto;
}
