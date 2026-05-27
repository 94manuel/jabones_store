import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @ApiPropertyOptional({ description: 'Carpeta logica dentro del bucket MinIO', example: 'productos/manuales' })
  @IsOptional()
  @IsString()
  folder?: string;
}