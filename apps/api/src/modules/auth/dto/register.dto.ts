import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Laura Gómez' }) @IsString() @MinLength(2) name!: string;
  @ApiProperty({ example: 'cliente@email.com' }) @IsEmail() email!: string;
  @ApiPropertyOptional({ example: '3001234567' }) @IsOptional() @IsString() phone?: string;
  @ApiProperty({ example: 'ClaveSegura123!' }) @IsString() @MinLength(8) password!: string;
}
