import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty() @IsString() label!: string;
  @ApiProperty() @IsString() @MinLength(2) receiver!: string;
  @ApiProperty() @IsString() line1!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() line2?: string;
  @ApiProperty() @IsString() city!: string;
  @ApiProperty() @IsString() region!: string;
  @ApiProperty({ default: 'CO' }) @IsString() country: string = 'CO';
  @ApiProperty() @IsString() phone!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
}
