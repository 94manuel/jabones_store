import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
export class SendMessageDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(1000) message!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sessionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() visitorId?: string;
}
